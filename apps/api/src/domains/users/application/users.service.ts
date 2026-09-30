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

  async findById(id: string): Promise<User | null> {
    const e = await this.users.findOne({ where: { id } });
    return e ? toUser(e) : null;
  }

  async findWithCredentialsByEmail(email: string): Promise<UserWithCredentials | null> {
    const e = await this.users.findOne({ where: { email: normalizeEmail(email) } });
    return e ? { ...toUser(e), passwordHash: e.passwordHash } : null;
  }
}
