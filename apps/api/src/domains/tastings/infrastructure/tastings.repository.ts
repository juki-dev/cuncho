import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import type { Cursor } from '../../../shared/http';
import { Tasting, UserTastingStats } from '../domain/tasting';
import { TastingEntity } from './tasting.entity';

const toTasting = (e: TastingEntity): Tasting => ({
  id: e.id,
  userId: e.userId,
  placeId: e.placeId,
  createdAt: e.createdAt,
  variety: e.variety,
  farm: e.farm,
  region: e.region,
  process: e.process,
  method: e.method,
  acidityLevel: e.acidityLevel,
  acidityType: e.acidityType,
  notes: e.notes,
  descriptors: e.descriptors,
  score: e.score,
  scale: e.scale,
  normalizedScore: e.normalizedScore,
});

@Injectable()
export class TastingsRepository {
  constructor(@InjectRepository(TastingEntity) private readonly repo: Repository<TastingEntity>) {}

  async findById(id: string): Promise<Tasting | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? toTasting(e) : null;
  }

  async insert(manager: EntityManager, t: Tasting): Promise<void> {
    await manager.getRepository(TastingEntity).insert({ ...t });
  }

  /** Página de la bitácora ordenada por (created_at DESC, id DESC). Pide limit+1 para saber si hay más. */
  async listByUser(userId: string, cursor: Cursor | null, limit: number): Promise<{ items: Tasting[]; hasMore: boolean }> {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.user_id = :userId', { userId })
      .orderBy('t.created_at', 'DESC')
      .addOrderBy('t.id', 'DESC')
      .limit(limit + 1);
    if (cursor) {
      qb.andWhere('(t.created_at, t.id) < (:cAt::timestamptz, :cId::uuid)', { cAt: cursor.createdAt, cId: cursor.id });
    }
    const rows = await qb.getMany();
    return { items: rows.slice(0, limit).map(toTasting), hasMore: rows.length > limit };
  }

  async statsByUser(userId: string): Promise<UserTastingStats> {
    const [summary] = await this.repo.query<
      { total: number; avg: string | null; places: number; last: Date | null }[]
    >(
      `SELECT count(*)::int AS total,
              round(avg(normalized_score), 2) AS avg,
              count(DISTINCT place_id)::int AS places,
              max(created_at) AS last
         FROM tastings WHERE user_id = $1`,
      [userId],
    );
    const groupBy = (expr: string, from = 'tastings') =>
      this.repo.query<{ key: string; total: number }[]>(
        `SELECT ${expr} AS key, count(*)::int AS total FROM ${from}
          WHERE user_id = $1 GROUP BY 1 ORDER BY total DESC, key ASC`,
        [userId],
      );
    const [byDescriptor, byMethod, byProcess] = await Promise.all([
      groupBy('d', 'tastings CROSS JOIN LATERAL unnest(descriptors) AS d'),
      groupBy('method'),
      groupBy('process'),
    ]);
    return {
      total: summary?.total ?? 0,
      avgNormalizedScore: summary?.avg != null ? Number(summary.avg) : null,
      distinctPlaces: summary?.places ?? 0,
      lastTastingAt: summary?.last ?? null,
      byDescriptor,
      byMethod,
      byProcess,
    };
  }
}
