import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, numericTransformer } from '../../../shared/database';
import { GeoPoint, geographyPointTransformer } from '../../../shared/geo';
import type { FeaturedTasting } from '../domain/place';

@Entity({ name: 'places' })
export class PlaceEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Index('idx_places_location', { spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: geographyPointTransformer,
  })
  location!: GeoPoint;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  /** FK a users por nombre de entidad: no importa código del dominio users. */
  @ManyToOne('UserEntity', { onDelete: 'SET NULL', nullable: true, createForeignKeyConstraints: true })
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'fk_places_created_by' })
  creator?: unknown;

  /** Promedio del puntaje normalizado (0–100) de sus cataciones. */
  @Column({ name: 'avg_score', type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: numericTransformer })
  avgScore!: number | null;

  @Column({ name: 'tastings_count', type: 'integer', default: 0 })
  tastingsCount!: number;

  /** Índice GIN creado a mano en la migración (TypeORM no soporta GIN en decoradores). */
  @Index('idx_places_descriptors', { synchronize: false })
  @Column({ type: 'text', array: true, default: () => "'{}'" })
  descriptors!: string[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  notes!: string[];

  @Column({ type: 'jsonb', nullable: true })
  featured!: FeaturedTasting | null;
}
