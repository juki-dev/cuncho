import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository, SelectQueryBuilder } from 'typeorm';
import { BBox, GeoPoint } from '../../../shared/geo';
import { Place, PlaceWithDistance } from '../domain/place';
import { PlaceEntity } from './place.entity';

const toPlace = (e: PlaceEntity): Place => ({
  id: e.id,
  name: e.name,
  location: e.location,
  avgScore: e.avgScore,
  tastingsCount: e.tastingsCount,
  descriptors: e.descriptors,
  notes: e.notes,
  featured: e.featured,
});

const POINT_SQL = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';

@Injectable()
export class PlacesRepository {
  constructor(@InjectRepository(PlaceEntity) private readonly repo: Repository<PlaceEntity>) {}

  async findById(id: string): Promise<Place | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? toPlace(e) : null;
  }

  async findByIds(ids: string[]): Promise<Place[]> {
    if (!ids.length) return [];
    return (await this.repo.find({ where: { id: In(ids) } })).map(toPlace);
  }

  /** Lugares dentro de la caja (operador && sobre geography, apoyado en el índice GIST). */
  async findInBBox(bbox: BBox, limit: number): Promise<Place[]> {
    const rows = await this.repo
      .createQueryBuilder('p')
      .where('p.location && ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)::geography', { ...bbox })
      .orderBy('p.tastings_count', 'DESC')
      .addOrderBy('p.id', 'ASC')
      .limit(limit)
      .getMany();
    return rows.map(toPlace);
  }

  /**
   * Lugares a menos de `radiusM` metros del punto, con su distancia, ordenados por cercanía.
   * Si se pasan descriptores, solo los que comparten al menos uno (J > 0, índice GIN).
   */
  async findWithinRadius(
    point: GeoPoint,
    radiusM: number,
    opts: { limit: number; anyDescriptor?: readonly string[] },
  ): Promise<PlaceWithDistance[]> {
    const qb = this.withDistance(this.repo.createQueryBuilder('p'), point)
      .where(`ST_DWithin(p.location, ${POINT_SQL}, :radiusM)`, { radiusM })
      .orderBy('distance_m', 'ASC')
      .addOrderBy('p.id', 'ASC')
      .limit(opts.limit);
    if (opts.anyDescriptor?.length) {
      qb.andWhere('p.descriptors && :descriptors::text[]', { descriptors: [...opts.anyDescriptor] });
    }
    const { entities, raw } = await qb.getRawAndEntities<{ distance_m: string | number }>();
    return entities.map((e, i) => ({ ...toPlace(e), distanceM: Number(raw[i]!.distance_m) }));
  }

  async insert(data: { name: string; location: GeoPoint; address: string | null; createdBy: string }): Promise<Place> {
    const saved = await this.repo.save(this.repo.create({ ...data, tastingsCount: 0, descriptors: [], notes: [] }));
    const fresh = await this.repo.findOneOrFail({ where: { id: saved.id } });
    return toPlace(fresh);
  }

  /** Lee el lugar bloqueando la fila (SELECT … FOR UPDATE) dentro de una transacción. */
  async findForUpdate(manager: EntityManager, id: string): Promise<Place | null> {
    const e = await manager.getRepository(PlaceEntity).findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
    return e ? toPlace(e) : null;
  }

  async updateAggregate(manager: EntityManager, id: string, agg: Omit<Place, 'id' | 'name' | 'location'>): Promise<void> {
    await manager.getRepository(PlaceEntity).update(
      { id },
      {
        avgScore: agg.avgScore,
        tastingsCount: agg.tastingsCount,
        descriptors: agg.descriptors,
        notes: agg.notes,
        featured: agg.featured,
      },
    );
  }

  private withDistance(qb: SelectQueryBuilder<PlaceEntity>, point: GeoPoint): SelectQueryBuilder<PlaceEntity> {
    return qb.addSelect(`ST_Distance(p.location, ${POINT_SQL})`, 'distance_m').setParameters({
      lat: point.lat,
      lng: point.lng,
    });
  }
}
