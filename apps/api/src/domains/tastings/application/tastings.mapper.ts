import { PlaceRef, PlaceRefDto } from '../../places';
import { TastingResponseDto, TastingStatsDto } from '../api/tastings.dto';
import { Tasting, UserTastingStats } from '../domain/tasting';

export function toTastingResponse(t: Tasting, place: PlaceRef): TastingResponseDto {
  return {
    id: t.id,
    usuario_id: t.userId,
    creado_en: t.createdAt.toISOString(),
    lugar: PlaceRefDto.from(place),
    grano: { variedad: t.variety, finca: t.farm, region: t.region, proceso: t.process, metodo: t.method },
    sensorial: {
      acidez: { nivel: t.acidityLevel, tipo: t.acidityType },
      notas: t.notes,
      descriptores: t.descriptors,
      puntaje: t.score,
      escala: t.scale,
      puntaje_normalizado: t.normalizedScore,
    },
  };
}

export function toStatsResponse(s: UserTastingStats): TastingStatsDto {
  const counts = (rows: { key: string; total: number }[]) => rows.map((r) => ({ clave: r.key, total: r.total }));
  return {
    total_cataciones: s.total,
    puntaje_promedio: s.avgNormalizedScore,
    lugares_visitados: s.distinctPlaces,
    ultima_catacion_en: s.lastTastingAt ? new Date(s.lastTastingAt).toISOString() : null,
    por_descriptor: counts(s.byDescriptor),
    por_metodo: counts(s.byMethod),
    por_proceso: counts(s.byProcess),
  };
}
