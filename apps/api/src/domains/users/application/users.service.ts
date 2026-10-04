import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../../../shared/database';
import { EmailAlreadyRegisteredError, normalizeEmail, User, UserWithCredentials } from '../domain/user';
import { UserEntity } from '../infrastructure/user.entity';

const toUser = (e: UserEntity): User => ({
  id: e.id,
  email: e.email,
  displayName: e.displayName,
  role: e.role,
  createdAt: e.createdAt,
});

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly users: Repository<UserEntity>) {}

  async create(input: { email: string; passwordHash: string; displayName: string }): Promise<User> {
    try {
      const saved = await this.users.save(
        this.users.create({
          email: normalizeEmail(input.email),
          passwordHash: input.passwordHash,
          displayName: input.displayName.trim(),
          role: 'user',
        }),
      );
      return toUser(saved);
    } catch (e) {
      if (isUniqueViolation(e, 'uq_users_email')) throw new EmailAlreadyRegisteredError();
      throw e;
    }
  }

  /**
   * Usuario de una identidad de Cognito (Google). Orden: por `sub`; si no existe, por correo
   * (el correo viene verificado por Google, así que se vincula a la cuenta existente); si no, se crea.
   */
  async findOrCreateByCognito(input: { sub: string; email: string; displayName: string }): Promise<User> {
    const bySub = await this.users.findOne({ where: { cognitoSub: input.sub } });
    if (bySub) return toUser(bySub);

    const email = normalizeEmail(input.email);
    const byEmail = await this.users.findOne({ where: { email } });
    if (byEmail) {
      if (byEmail.cognitoSub && byEmail.cognitoSub !== input.sub) throw new EmailAlreadyRegisteredError();
      byEmail.cognitoSub = input.sub;
      return toUser(await this.users.save(byEmail));
    }
    try {
      const saved = await this.users.save(
        this.users.create({
          email,
          passwordHash: null,
          cognitoSub: input.sub,
          displayName: input.displayName.trim().slice(0, 80) || email.split('@')[0]!,
          role: 'user',
        }),
      );
      return toUser(saved);
    } catch (e) {
      // Dos inicios de sesión simultáneos del mismo usuario: gana el primero, se reutiliza.
      if (isUniqueViolation(e, 'uq_users_email') || isUniqueViolation(e, 'uq_users_cognito_sub')) {
        const again = await this.users.findOne({ where: [{ cognitoSub: input.sub }, { email }] });
        if (again) return toUser(again);
      }
      throw e;
    }
  }

  async findById(id: string): Promise<User | null> {
    const e = await this.users.findOne({ where: { id } });
    return e ? toUser(e) : null;
  }

  async findWithCredentialsByEmail(email: string): Promise<UserWithCredentials | null> {
    const e = await this.users.findOne({ where: { email: normalizeEmail(email) } });
    return e ? { ...toUser(e), passwordHash: e.passwordHash } : null;
  }
}
