import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

/**
 * Refresh tokens rotativos. Cada login abre una "familia"; cada refresh revoca
 * el token usado y emite otro en la misma familia. Si se reutiliza un token ya
 * revocado se revoca la familia completa (detección de robo).
 */
@Entity({ name: 'refresh_tokens' })
@Index('idx_refresh_tokens_family', ['familyId'])
@Index('idx_refresh_tokens_user', ['userId'])
export class RefreshTokenEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /** FK por nombre de entidad: no importa código del dominio users. */
  @ManyToOne('UserEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_refresh_tokens_user' })
  user?: unknown;

  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'replaced_by', type: 'uuid', nullable: true })
  replacedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
