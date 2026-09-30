import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { DataSource, IsNull, Repository } from 'typeorm';
import { TypedConfigService } from '../../../shared/config';
import { EmailAlreadyRegisteredError, User, UsersService } from '../../users';
import { AuthTokensDto } from '../api/auth.dto';
import {
  formatRefreshToken,
  generateRefreshSecret,
  hashRefreshSecret,
  parseRefreshToken,
  secretMatches,
} from '../domain/refresh-token';
import { RefreshTokenEntity } from '../infrastructure/refresh-token.entity';
import { AccessTokenPayload } from '../infrastructure/jwt.strategy';

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos';
const INVALID_REFRESH = 'Refresh token inválido o expirado';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** Hash de referencia para igualar tiempos cuando el correo no existe. */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: TypedConfigService,
    @InjectRepository(RefreshTokenEntity) private readonly tokens: Repository<RefreshTokenEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async register(input: { email: string; password: string; nombre: string }): Promise<AuthTokensDto> {
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    try {
      const user = await this.users.create({ email: input.email, passwordHash, displayName: input.nombre });
      return this.issueTokens(user, randomUUID());
    } catch (e) {
      if (e instanceof EmailAlreadyRegisteredError) throw new ConflictException(e.message);
      throw e;
    }
  }

  async login(email: string, password: string): Promise<AuthTokensDto> {
    const user = await this.users.findWithCredentialsByEmail(email);
    if (!user) {
      this.dummyHash ??= argon2.hash('timing-equalizer', { type: argon2.argon2id });
      await argon2.verify(await this.dummyHash, password).catch(() => false);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!ok) throw new UnauthorizedException(INVALID_CREDENTIALS);
    return this.issueTokens(user, randomUUID());
  }

  /** Rota el refresh token. Reutilizar uno ya rotado revoca toda la familia. */
  async refresh(rawToken: string): Promise<AuthTokensDto> {
    const parsed = parseRefreshToken(rawToken);
    if (!parsed) throw new UnauthorizedException(INVALID_REFRESH);

    const result = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RefreshTokenEntity);
      const stored = await repo.findOne({ where: { id: parsed.id }, lock: { mode: 'pessimistic_write' } });
      if (!stored || !secretMatches(parsed.secret, stored.tokenHash)) return { kind: 'invalid' as const };

      if (stored.revokedAt) {
        await repo.update({ familyId: stored.familyId, revokedAt: IsNull() }, { revokedAt: new Date() });
        return { kind: 'reused' as const, userId: stored.userId };
      }
      if (stored.expiresAt.getTime() <= Date.now()) return { kind: 'invalid' as const };

      const nextId = randomUUID();
      stored.revokedAt = new Date();
      stored.replacedBy = nextId;
      await repo.save(stored);
      return { kind: 'ok' as const, userId: stored.userId, familyId: stored.familyId, nextId };
    });

    if (result.kind === 'reused') {
      this.logger.warn({ userId: result.userId }, 'Reutilización de refresh token: familia revocada');
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    if (result.kind === 'invalid') throw new UnauthorizedException(INVALID_REFRESH);

    const user = await this.users.findById(result.userId);
    if (!user) throw new UnauthorizedException(INVALID_REFRESH);
    return this.issueTokens(user, result.familyId, result.nextId);
  }

  /** Revoca la familia del refresh token. Idempotente: nunca revela si el token existía. */
  async logout(rawToken: string): Promise<void> {
    const parsed = parseRefreshToken(rawToken);
    if (!parsed) return;
    const stored = await this.tokens.findOne({ where: { id: parsed.id } });
    if (!stored || !secretMatches(parsed.secret, stored.tokenHash)) return;
    await this.tokens.update({ familyId: stored.familyId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  private async issueTokens(user: User, familyId: string, tokenId: string = randomUUID()): Promise<AuthTokensDto> {
    const { accessTtlSeconds, refreshTtlSeconds } = this.config.get('jwt');
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);

    const secret = generateRefreshSecret();
    await this.tokens.insert({
      id: tokenId,
      userId: user.id,
      familyId,
      tokenHash: hashRefreshSecret(secret),
      expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
      revokedAt: null,
      replacedBy: null,
    });

    return {
      access_token: accessToken,
      expires_in: accessTtlSeconds,
      refresh_token: formatRefreshToken(tokenId, secret),
      token_type: 'Bearer',
      usuario: { id: user.id, email: user.email, nombre: user.displayName },
    };
  }
}
