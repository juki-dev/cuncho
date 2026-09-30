import { BadRequestException, Injectable } from '@nestjs/common';
import { TypedConfigService } from '../../../shared/config';
import { GeoPoint } from '../../../shared/geo';
import { CatalogService } from '../../catalog';
import { PlaceDto, PlaceRefDto, PlacesService } from '../../places';
import { RecommendationQueryDto, RecommendationResponseDto } from '../api/recommendations.dto';
import { rankCandidates } from '../domain/scoring';

/** Cuántos candidatos trae PostGIS antes de puntuar en memoria. */
const CANDIDATE_POOL = 200;

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly places: PlacesService,
    private readonly catalog: CatalogService,
    private readonly config: TypedConfigService,
  ) {}

  async recommend(q: RecommendationQueryDto): Promise<RecommendationResponseDto> {
    const cfg = this.config.get('recommendation');
    const radiusKm = q.radius ?? cfg.defaultRadiusKm;
    if (radiusKm > cfg.maxRadiusKm) throw new BadRequestException(`radius no puede superar ${cfg.maxRadiusKm} km`);
    const radiusM = radiusKm * 1000;

    const candidates = await this.places.findCandidates(GeoPoint.of(q.lat, q.lng), radiusM, q.descriptors, CANDIDATE_POOL);
    const ranked = rankCandidates(q.descriptors, candidates, radiusM, cfg.weights).slice(0, cfg.maxResults);
    const wanted = new Set<string>(q.descriptors);

    return {
      radio_km: radiusKm,
      descriptores: q.descriptors,
      resultados: ranked.map(({ candidate: p, jaccard, score }) => {
        const dto = PlaceDto.fromPlace(p);
        return {
          lugar: PlaceRefDto.from(p),
          distancia_m: Math.round(p.distanceM),
          coincidencia: round(jaccard, 4),
          puntaje_promedio: p.avgScore,
          total_cataciones: p.tastingsCount,
          descriptores: p.descriptors,
          notas_coincidentes: p.notes.filter((n) => {
            const d = this.catalog.descriptorOf(n);
            return d !== undefined && wanted.has(d);
          }),
          destacada: dto.destacada,
          score: round(score, 4),
        };
      }),
    };
  }
}
