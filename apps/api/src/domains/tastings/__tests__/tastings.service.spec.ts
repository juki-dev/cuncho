import { ConflictException, HttpException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GeoPoint } from '../../../shared/geo';
import type { AuthenticatedUser } from '../../../shared/types';
import { CatalogService } from '../../catalog';
import { PlacesService } from '../../places';
import { CreateTastingDto } from '../api/tastings.dto';
import { TastingsService } from '../application/tastings.service';
import { Tasting } from '../domain/tasting';
import { TastingsRepository } from '../infrastructure/tastings.repository';

const ANA: AuthenticatedUser = { id: 'user-ana', email: 'ana@x.co', role: 'user' };
const LUIS: AuthenticatedUser = { id: 'user-luis', email: 'luis@x.co', role: 'user' };
const TID = '0b7c0f6e-2f0e-4b8e-9d7c-1f5a8b2c3d4e';
const PLACE = { id: 'place-1', name: 'Origen', location: GeoPoint.of(5.0689, -75.5174) };

const dto = (over: Partial<CreateTastingDto> = {}): CreateTastingDto => ({
  id: TID,
  lugar: { id: PLACE.id },
  grano: { variedad: 'Geisha', proceso: 'Lavado', metodo: 'V60' },
  sensorial: {
    acidez: { nivel: 3, tipo: 'Cítrica' },
    notas: ['Jazmín', 'Cítricos'],
    descriptores: ['chocolate'],
    puntaje: 8.5,
    escala: 'Personal',
  },
  ...over,
});

const existing = (userId: string): Tasting => ({
  id: TID,
  userId,
  placeId: PLACE.id,
  createdAt: new Date('2026-09-28T00:00:00Z'),
  variety: 'Geisha',
  farm: null,
  region: null,
  process: 'Lavado',
  method: 'V60',
  acidityLevel: 3,
  acidityType: 'Cítrica',
  notes: ['Jazmín'],
  descriptors: ['floral'],
  score: 90,
  scale: 'SCA',
  normalizedScore: 90,
});

function setup() {
  const repo = { findById: jest.fn(), insert: jest.fn() };
  const places = { getRef: jest.fn().mockResolvedValue(PLACE), applyTasting: jest.fn() };
  const dataSource = { transaction: jest.fn((fn: (m: unknown) => Promise<void>) => fn({})) };
  const service = new TastingsService(
    repo as unknown as TastingsRepository,
    places as unknown as PlacesService,
    new CatalogService(),
    dataSource as unknown as DataSource,
  );
  return { service, repo, places };
}

describe('TastingsService', () => {
  it('crea: deriva descriptores de las notas (ignora los del cliente) y normaliza el puntaje', async () => {
    const { service, repo, places } = setup();
    repo.findById.mockResolvedValue(null);
    const res = await service.create(ANA, dto());
    expect(res.created).toBe(true);
    expect(res.tasting.sensorial.descriptores).toEqual(['floral', 'frutal']);
    expect(res.tasting.sensorial.puntaje_normalizado).toBe(85);
    expect(places.applyTasting).toHaveBeenCalledWith(
      expect.anything(),
      PLACE.id,
      expect.objectContaining({ normalizedScore: 85, descriptors: ['floral', 'frutal'] }),
    );
  });

  it('reintento del mismo usuario devuelve la existente sin insertar', async () => {
    const { service, repo } = setup();
    repo.findById.mockResolvedValue(existing(ANA.id));
    const res = await service.create(ANA, dto());
    expect(res.created).toBe(false);
    expect(res.tasting.id).toBe(TID);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('id ya usado por otro usuario → 409', async () => {
    const { service, repo } = setup();
    repo.findById.mockResolvedValue(existing(LUIS.id));
    await expect(service.create(ANA, dto())).rejects.toBeInstanceOf(ConflictException);
  });

  it('puntaje inválido para la escala → 400 antes de tocar la base', async () => {
    const { service, repo } = setup();
    repo.findById.mockResolvedValue(null);
    const bad = dto();
    bad.sensorial.puntaje = 8.25;
    await expect(service.create(ANA, bad)).rejects.toMatchObject({ status: 400 });
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('lugar inexistente → 404', async () => {
    const { service, repo, places } = setup();
    repo.findById.mockResolvedValue(null);
    places.getRef.mockResolvedValue(null);
    const err = await service.create(ANA, dto()).catch((e: unknown) => e);
    expect((err as HttpException).getStatus()).toBe(404);
  });

  it('solo el dueño puede ver el detalle', async () => {
    const { service, repo } = setup();
    repo.findById.mockResolvedValue(existing(LUIS.id));
    await expect(service.getById(ANA, TID)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getById(LUIS, TID)).resolves.toMatchObject({ id: TID });
  });
});
