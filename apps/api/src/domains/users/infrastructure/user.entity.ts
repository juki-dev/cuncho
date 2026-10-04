import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../shared/database';
import type { UserRole } from '../../../shared/types';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @Index('uq_users_email', { unique: true })
  @Column({ type: 'varchar', length: 254 })
  email!: string;

  /** null en cuentas creadas con Google (no tienen contraseña). */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  /** `sub` del usuario en el pool de Cognito (identidad federada de Google). */
  @Index('uq_users_cognito_sub', { unique: true, where: '"cognito_sub" IS NOT NULL' })
  @Column({ name: 'cognito_sub', type: 'varchar', length: 64, nullable: true })
  cognitoSub!: string | null;

  @Column({ name: 'display_name', type: 'varchar', length: 80 })
  displayName!: string;

  @Column({ type: 'varchar', length: 16, default: 'user' })
  role!: UserRole;
}
