import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../../shared/database';
import type { AcidityLevel, AcidityType, BrewMethod, Descriptor, Process, Scale } from '../../catalog';

/**
 * Catación. El id lo puede generar el cliente (idempotencia offline), por eso
 * no es autogenerado. Las FKs a users/places se declaran por nombre de entidad
 * para no importar código de otros dominios.
 */
@Entity({ name: 'tastings' })
@Index('idx_tastings_user_created', { synchronize: false })
@Index('idx_tastings_place', ['placeId'])
@Check('chk_tastings_process', `"process" IN ('Lavado', 'Natural', 'Honey', 'Anaeróbico')`)
@Check('chk_tastings_method', `"method" IN ('V60', 'Aeropress', 'Espresso', 'Chemex', 'Prensa Francesa')`)
@Check('chk_tastings_acidity_level', `"acidity_level" BETWEEN 1 AND 5`)
@Check('chk_tastings_acidity_type', `"acidity_type" IN ('Láctica', 'Málica', 'Cítrica', 'Tartárica', 'Fosfórica')`)
@Check('chk_tastings_scale', `"scale" IN ('SCA', 'Personal')`)
@Check('chk_tastings_normalized_score', `"normalized_score" BETWEEN 0 AND 100`)
export class TastingEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne('UserEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_tastings_user' })
  user?: unknown;

  @Column({ name: 'place_id', type: 'uuid' })
  placeId!: string;

  @ManyToOne('PlaceEntity', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'place_id', foreignKeyConstraintName: 'fk_tastings_place' })
  place?: unknown;

  /** Momento de la catación (lo envía el cliente como `creado_en`). */
  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  /** Momento en que el servidor la recibió (útil para sincronización offline). */
  @Column({ name: 'received_at', type: 'timestamptz', default: () => 'now()' })
  receivedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 80 })
  variety!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  farm!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  region!: string | null;

  @Column({ type: 'varchar', length: 16 })
  process!: Process;

  @Column({ type: 'varchar', length: 24 })
  method!: BrewMethod;

  @Column({ name: 'acidity_level', type: 'smallint' })
  acidityLevel!: AcidityLevel;

  @Column({ name: 'acidity_type', type: 'varchar', length: 16 })
  acidityType!: AcidityType;

  @Column({ type: 'text', array: true })
  notes!: string[];

  @Column({ type: 'text', array: true })
  descriptors!: Descriptor[];

  @Column({ type: 'numeric', precision: 5, scale: 2, transformer: numericTransformer })
  score!: number;

  @Column({ type: 'varchar', length: 10 })
  scale!: Scale;

  @Column({ name: 'normalized_score', type: 'numeric', precision: 5, scale: 2, transformer: numericTransformer })
  normalizedScore!: number;
}
