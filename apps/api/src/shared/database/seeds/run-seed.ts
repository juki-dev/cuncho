import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import dataSource from '../data-source';
import { DEMO_USER, PLACES, TASTINGS } from './dev-data';

/**
 * Seed de desarrollo. Usa SQL directo (shared/ no conoce los dominios) y
 * recalcula los agregados de places al final. Idempotente: si el usuario demo
 * existe, no hace nada.
 */
async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('El seed no se ejecuta en producción');
  await dataSource.initialize();
  try {
    const existing = await dataSource.query<unknown[]>('SELECT 1 FROM users WHERE email = $1', [DEMO_USER.email]);
    if (existing.length) {
      console.log('Seed ya aplicado; nada que hacer.');
      return;
    }
    await dataSource.transaction(async (m) => {
      const userId = randomUUID();
      await m.query(`INSERT INTO users (id, email, password_hash, display_name) VALUES ($1, $2, $3, $4)`, [
        userId,
        DEMO_USER.email,
        await argon2.hash(DEMO_USER.password, { type: argon2.argon2id }),
        DEMO_USER.name,
      ]);

      const placeIds = new Map<string, string>();
      for (const p of PLACES) {
        const id = randomUUID();
        placeIds.set(p.key, id);
        await m.query(
          `INSERT INTO places (id, name, location, created_by)
           VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5)`,
          [id, p.name, p.lng, p.lat, userId],
        );
      }

      for (const t of TASTINGS) {
        const normalized = t.scale === 'SCA' ? t.score : t.score * 10;
        await m.query(
          `INSERT INTO tastings (id, user_id, place_id, created_at, variety, farm, region, process, method,
                                 acidity_level, acidity_type, notes, descriptors, score, scale, normalized_score)
           VALUES ($1, $2, $3, now() - make_interval(days => $4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [randomUUID(), userId, placeIds.get(t.place), t.daysAgo, t.variety, t.farm, t.region, t.process, t.method,
           t.acidity[0], t.acidity[1], t.notes, t.descriptors, t.score, t.scale, normalized],
        );
      }

      // Agregados desnormalizados (misma lógica que places/domain/place-aggregate).
      await m.query(`
        UPDATE places p SET
          avg_score = a.avg_score,
          tastings_count = a.cnt,
          descriptors = a.descriptors,
          notes = a.notes,
          featured = a.featured
        FROM (
          SELECT t.place_id,
                 round(avg(t.normalized_score), 2) AS avg_score,
                 count(*)::int AS cnt,
                 ARRAY(SELECT DISTINCT d FROM tastings t2, unnest(t2.descriptors) d WHERE t2.place_id = t.place_id ORDER BY d) AS descriptors,
                 ARRAY(SELECT DISTINCT n FROM tastings t2, unnest(t2.notes) n WHERE t2.place_id = t.place_id ORDER BY n) AS notes,
                 (SELECT jsonb_build_object('tastingId', b.id, 'normalizedScore', b.normalized_score, 'variety', b.variety,
                                            'process', b.process, 'method', b.method, 'notes', to_jsonb(b.notes))
                    FROM tastings b WHERE b.place_id = t.place_id
                   ORDER BY b.normalized_score DESC, b.created_at DESC LIMIT 1) AS featured
            FROM tastings t GROUP BY t.place_id
        ) a
        WHERE p.id = a.place_id`);
    });
    console.log(`Seed aplicado. Usuario demo: ${DEMO_USER.email} / ${DEMO_USER.password}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
