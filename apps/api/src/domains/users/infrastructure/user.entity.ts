import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../shared/database';
import type { UserRole } from '../../../shared/types';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @Index('uq_users_email', { unique: true })
  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 80 })
  displayName!: string;

  @Column({ type: 'varchar', length: 16, default: 'user' })
  role!: UserRole;
}
