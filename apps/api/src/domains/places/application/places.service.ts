import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AppException } from '../../../shared/http';
import { GeoPoint, InvalidBBoxError, parseBBox } from '../../../shared/geo';
import type { AuthenticatedUser } from '../../../shared/types';
import { CreatePlaceDto, NearbyPlaceDto, PlaceDto } from '../api/places.dto';
import { DUPLICATE_RADIUS_M, findDuplicate } from '../domain/duplicate-detection';
import { PlaceNotFoundError, PlaceRef, PlaceWithDistance, TastingContribution } from '../domain/place';
import { applyTasting } from '../domain/place-aggregate';
import { PlacesRepository } from '../infrastructure/places.repository';

const MAX_BBOX_RESULTS = 500;
const MAX_NEARBY_RESULTS = 50;

@Injectable()
export class PlacesService {
  constructor(private readonly places: PlacesRepository) {}

  // ---------- casos de uso expuestos por la API ----------

  async listInBBox(rawBBox: string): Promise<PlaceDto[]> {
    let bbox;
    try {
      bbox = parseBBox(rawBBox);
    } catch (e) {
      if (e instanceof InvalidBBoxError) throw new BadRequestException(e.message);
      throw e;
    }
    return (await this.places.findInBBox(bbox, MAX_BBOX_RESULTS)).map((p) => PlaceDto.fromPlace(p));
  }

  async nearby(lat: number, lng: number, radiusKm: number): Promise<NearbyPlaceDto[]> {
    const rows = await this.places.findWithinRadius(GeoPoint.of(lat, lng), radiusKm * 1000, {
      limit: MAX_NEARBY_RESULTS,
    });
    return rows.map((p) => NearbyPlaceDto.fromNearby(p));
  }

  /** Crea un lugar salvo que ya exista uno a menos de ~30 m con nombre parecido (409 con el existente). */
  async create(user: AuthenticatedUser, dto: CreatePlaceDto): Promise<PlaceDto> {
    const location = GeoPoint.of(dto.lat, dto.lng);
    const candidates = await this.places.findWithinRadius(location, DUPLICATE_RADIUS_M, { limit: 20 });
    const duplicate = findDuplicate(dto.nombre, candidates);
    if (duplicate) {
      throw new AppException(HttpStatus.CONFLICT, 'Ya existe un lugar con nombre parecido a menos de 30 m', {
        lugar_existente: NearbyPlaceDto.fromNearby(duplicate),
      });
    }
    const place = await this.places.insert({
      name: dto.nombre,
      location,
      address: dto.direccion ?? null,
      createdBy: user.id,
    });
    return PlaceDto.fromPlace(place);
  }

  // ---------- API para otros dominios ----------

  async getRef(id: string): Promise<PlaceRef | null> {
    return this.places.findById(id);
  }

  async getRefs(ids: string[]): Promise<Map<string, PlaceRef>> {
    const rows = await this.places.findByIds([...new Set(ids)]);
    return new Map(rows.map((p) => [p.id, p]));
  }

  /** Candidatos a recomendación: dentro del radio y con al menos un descriptor en común. */
  findCandidates(point: GeoPoint, radiusM: number, descriptors: readonly string[], limit: number): Promise<PlaceWithDistance[]> {
    return this.places.findWithinRadius(point, radiusM, { limit, anyDescriptor: descriptors });
  }

  /**
   * Actualiza los agregados del lugar con una catación nueva. Debe llamarse
   * dentro de la transacción que inserta la catación (bloquea la fila).
   */
  async applyTasting(manager: EntityManager, placeId: string, contribution: TastingContribution): Promise<void> {
    const place = await this.places.findForUpdate(manager, placeId);
    if (!place) throw new PlaceNotFoundError(placeId);
    await this.places.updateAggregate(manager, placeId, applyTasting(place, contribution));
  }
}

