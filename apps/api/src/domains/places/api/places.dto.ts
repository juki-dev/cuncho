import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { DESCRIPTORS } from '../../catalog';
import { Place, PlaceRef, PlaceWithDistance } from '../domain/place';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// ---------- requests ----------

export class BBoxQueryDto {
  @ApiProperty({ description: 'minLng,minLat,maxLng,maxLat', example: '-75.53,5.06,-75.50,5.08' })
  @IsString()
  @MaxLength(100)
  bbox!: string;
}

export class NearbyQueryDto {
  @ApiProperty({ example: 5.0689 })
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: -75.5174 })
  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  @ApiPropertyOptional({ description: 'Radio en km', default: 1, minimum: 0.05, maximum: 10, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.05)
  @Max(10)
  radius: number = 1;
}

export class CreatePlaceDto {
  @ApiProperty({ example: 'Origen Cafetería', maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ example: 5.0689 })
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: -75.5174 })
  @IsLongitude()
  lng!: number;

  @ApiPropertyOptional({ example: 'Cra 23 # 62-10, Manizales', maxLength: 200 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  direccion?: string;
}

// ---------- responses ----------

export class PlaceRefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Origen Cafetería' }) nombre!: string;
  @ApiProperty({ example: 5.0689 }) lat!: number;
  @ApiProperty({ example: -75.5174 }) lng!: number;

  static from(p: PlaceRef): PlaceRefDto {
    return { id: p.id, nombre: p.name, lat: p.location.lat, lng: p.location.lng };
  }
}

export class FeaturedTastingDto {
  @ApiProperty({ example: 'Bourbon Rosado' }) variedad!: string;
  @ApiProperty({ example: 'Anaeróbico' }) proceso!: string;
  @ApiProperty({ example: 'Aeropress' }) metodo!: string;
  @ApiProperty({ type: [String], example: ['Frutos Rojos', 'Hibisco'] }) notas!: string[];
  @ApiProperty({ example: 92, description: 'Puntaje normalizado 0–100' }) puntaje!: number;
}

export class PlaceDto extends PlaceRefDto {
  @ApiProperty({ type: Number, nullable: true, example: 89.5, description: 'Promedio normalizado 0–100; null sin cataciones' })
  puntaje_promedio!: number | null;

  @ApiProperty({ example: 7 }) total_cataciones!: number;

  @ApiProperty({ enum: DESCRIPTORS, isArray: true, example: ['floral', 'frutal'] })
  descriptores!: string[];

  @ApiProperty({ type: FeaturedTastingDto, nullable: true })
  destacada!: FeaturedTastingDto | null;

  static fromPlace(p: Place): PlaceDto {
    return {
      ...PlaceRefDto.from(p),
      puntaje_promedio: p.avgScore,
      total_cataciones: p.tastingsCount,
      descriptores: p.descriptors,
      destacada: p.featured
        ? {
            variedad: p.featured.variety,
            proceso: p.featured.process,
            metodo: p.featured.method,
            notas: p.featured.notes,
            puntaje: p.featured.normalizedScore,
          }
        : null,
    };
  }
}

export class NearbyPlaceDto extends PlaceDto {
  @ApiProperty({ example: 40, description: 'Distancia en metros desde el punto consultado' })
  distancia_m!: number;

  static fromNearby(p: PlaceWithDistance): NearbyPlaceDto {
    return { ...PlaceDto.fromPlace(p), distancia_m: Math.round(p.distanceM) };
  }
}

export class DuplicatePlaceDetailsDto {
  @ApiProperty({ type: NearbyPlaceDto }) lugar_existente!: NearbyPlaceDto;
}
