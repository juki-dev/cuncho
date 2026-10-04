import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import { TypedConfigService } from '../../../shared/config';

export interface CognitoIdentity {
  sub: string;
  email: string;
  name: string;
}

/** Token de inyección para poder sustituir el verificador en las pruebas. */
export const COGNITO_VERIFIER = Symbol('COGNITO_VERIFIER');

export interface CognitoVerifier {
  readonly enabled: boolean;
  /** Valida el ID token emitido por Cognito y devuelve la identidad. Lanza 401 si no es válido. */
  verify(idToken: string): Promise<CognitoIdentity>;
}

const INVALID = 'Token de Google inválido o expirado';

@Injectable()
export class JoseCognitoVerifier implements CognitoVerifier {
  private readonly logger = new Logger(JoseCognitoVerifier.name);
  private readonly cfg: { issuer: string; clientId: string } | null;
  private keys?: JWTVerifyGetKey;

  constructor(config: TypedConfigService) {
    this.cfg = config.get('cognito');
  }

  /** Solo para pruebas: JWKS local. En producción las llaves se descargan de Cognito y se cachean. */
  useKeysForTesting(keys: JWTVerifyGetKey): this {
    this.keys = keys;
    return this;
  }

  get enabled(): boolean {
    return this.cfg !== null;
  }

  async verify(idToken: string): Promise<CognitoIdentity> {
    if (!this.cfg) throw new UnauthorizedException(INVALID);
    const { issuer, clientId } = this.cfg;
    this.keys ??= createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
    try {
      const { payload } = await jwtVerify(idToken, this.keys, { issuer, audience: clientId, algorithms: ['RS256'] });
      const problema = claimsProblem(payload);
      if (problema) {
        // Nunca se registra el token ni el correo: solo qué falló y los nombres de los claims.
        this.logger.warn({ motivo: problema, claims: Object.keys(payload) }, 'ID token de Cognito rechazado');
        throw new UnauthorizedException(INVALID);
      }
      return { sub: payload.sub!, email: payload.email as string, name: typeof payload.name === 'string' ? payload.name : '' };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      const err = e as { code?: string; claim?: string; name?: string };
      this.logger.warn({ motivo: err.code ?? err.name, claim: err.claim }, 'ID token de Cognito inválido');
      throw new UnauthorizedException(INVALID);
    }
  }
}

/** Devuelve por qué los claims no sirven, o null si están bien. */
function claimsProblem(p: JWTPayload): string | null {
  if (p.token_use !== 'id') return `token_use=${String(p.token_use)}`;
  if (typeof p.sub !== 'string') return 'sin sub';
  if (typeof p.email !== 'string') return 'sin email';
  if (!(p.email_verified === true || p.email_verified === 'true')) {
    return `email_verified=${JSON.stringify(p.email_verified)} (${typeof p.email_verified})`;
  }
  return null;
}
