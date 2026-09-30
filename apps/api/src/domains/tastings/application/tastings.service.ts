import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '../../../shared/database';
import { AppException, CursorPage, decodeCursor, encodeCursor } from '../../../shared/http';
import type { AuthenticatedUser } from '../../../shared/types';
import { CatalogService, UnknownNotesError } from '../../catalog';
import { PlaceNotFoundError, PlacesService } from '../../places';
import { CreateTastingDto, TastingResponseDto, TastingStatsDto } from '../api/tastings.dto';
import { resolveTastingId } from '../domain/idempotency';
import { normalizeScore, validateScore } from '../domain/score';
import { Tasting } from '../domain/tasting';
import { resolveTastingDate } from '../domain/tasting-date';
import { TastingsRepository } from '../infrastructure/tastings.repository';
import { toStatsResponse, toTastingResponse } from './tastings.mapper';

export interface CreateTastingResult {
  created: boolean;
  tasting: TastingResponseDto;
}

const badRequest = (message: string, field: string) =>
  new AppException(HttpStatus.BAD_REQUEST, message, [{ field, errors: [message] }]);

@Injectable()
export class TastingsService {
  constructor(
    private readonly tastings: TastingsRepository,
    private readonly places: PlacesService,
    private readonly catalog: CatalogService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea una catación de forma idempotente: si ya existe una con el mismo id
   * del mismo usuario, la devuelve sin crear otra (`created: false`).
   */
  async create(user: AuthenticatedUser, dto: CreateTastingDto, idempotencyKey?: string): Promise<CreateTastingResult> {
    const resolved = resolveTastingId(dto.id, idempotencyKey, randomUUID);
    if ('error' in resolved) throw badRequest(resolved.error, 'id');

    if (resolved.clientProvided) {
      const existing = await this.findExisting(user, resolved.id);
      if (existing) return { created: false, tasting: existing };
    }

    const tasting = this.buildTasting(user, resolved.id, dto);
    const place = await this.places.getRef(tasting.placeId);
    if (!place) throw new AppException(HttpStatus.NOT_FOUND, 'Lugar no encontrado', [{ field: 'lugar.id', errors: ['no existe'] }]);

    try {
      await this.dataSource.transaction(async (manager) => {
        await this.tastings.insert(manager, tasting);
        await this.places.applyTasting(manager, tasting.placeId, {
          tastingId: tasting.id,
          normalizedScore: tasting.normalizedScore,
          descriptors: tasting.descriptors,
          notes: tasting.notes,
          variety: tasting.variety,
          process: tasting.process,
          method: tasting.method,
        });
      });
    } catch (e) {
      // Reintento concurrente con el mismo id: gana el primero, este devuelve la existente.
      if (isUniqueViolation(e) && resolved.clientProvided) {
        const existing = await this.findExisting(user, resolved.id);
        if (existing) return { created: false, tasting: existing };
      }
      if (e instanceof PlaceNotFoundError) throw new NotFoundException('Lugar no encontrado');
      throw e;
    }
    return { created: true, tasting: toTastingResponse(tasting, place) };
  }

  async getById(user: AuthenticatedUser, id: string): Promise<TastingResponseDto> {
    const tasting = await this.tastings.findById(id);
    // Otro usuario: 404 para no revelar que existe.
    if (!tasting || tasting.userId !== user.id) throw new NotFoundException('Catación no encontrada');
    return this.withPlace(tasting);
  }

  async listMine(user: AuthenticatedUser, rawCursor: string | undefined, limit: number): Promise<CursorPage<TastingResponseDto>> {
    const cursor = rawCursor ? decodeCursor(rawCursor) : null;
    const { items, hasMore } = await this.tastings.listByUser(user.id, cursor, limit);
    const places = await this.places.getRefs(items.map((t) => t.placeId));
    const last = items[items.length - 1];
    return {
      items: items.map((t) => toTastingResponse(t, places.get(t.placeId)!)),
      siguiente_cursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id }) : null,
    };
  }

  async statsMine(user: AuthenticatedUser): Promise<TastingStatsDto> {
    return toStatsResponse(await this.tastings.statsByUser(user.id));
  }

  // ---------- privados ----------

  private async findExisting(user: AuthenticatedUser, id: string): Promise<TastingResponseDto | null> {
    const existing = await this.tastings.findById(id);
    if (!existing) return null;
    if (existing.userId !== user.id) throw new ConflictException('El id de catación ya está en uso');
    return this.withPlace(existing);
  }

  private async withPlace(t: Tasting): Promise<TastingResponseDto> {
    const place = await this.places.getRef(t.placeId);
    if (!place) throw new NotFoundException('Lugar no encontrado');
    return toTastingResponse(t, place);
  }

  /** Aplica las reglas de negocio y arma la catación. No confía en los descriptores del cliente. */
  private buildTasting(user: AuthenticatedUser, id: string, dto: CreateTastingDto): Tasting {
    const { sensorial, grano } = dto;

    const scoreError = validateScore(sensorial.escala, sensorial.puntaje);
    if (scoreError) throw badRequest(scoreError, 'sensorial.puntaje');

    const date = resolveTastingDate(dto.creado_en, new Date());
    if ('error' in date) throw badRequest(date.error, 'creado_en');

    let descriptors;
    try {
      descriptors = this.catalog.descriptorsFromNotes(sensorial.notas);
    } catch (e) {
      if (e instanceof UnknownNotesError) throw badRequest(e.message, 'sensorial.notas');
      throw e;
    }

    return {
      id,
      userId: user.id,
      placeId: dto.lugar.id,
      createdAt: date.date,
      variety: grano.variedad,
      farm: grano.finca || null,
      region: grano.region || null,
      process: grano.proceso,
      method: grano.metodo,
      acidityLevel: sensorial.acidez.nivel,
      acidityType: sensorial.acidez.tipo,
      notes: sensorial.notas,
      descriptors,
      score: sensorial.puntaje,
      scale: sensorial.escala,
      normalizedScore: normalizeScore(sensorial.escala, sensorial.puntaje),
    };
  }
}
