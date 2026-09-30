import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { DESCRIPTORS } from '../../catalog';
import type { Descriptor } from '../../catalog';
import { FeaturedTastingDto, PlaceRefDto } from '../../places';

const csv = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
    : value;

export class RecommendationQueryDto {
  @ApiProperty({ example: 5.0689 })
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: -75.5174 })
  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  @ApiProperty({ description: 'Descriptores separados por coma', example: 'frutal,floral', type: String })
  @Transform(csv)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(DESCRIPTORS.length)
  @ArrayUnique()
  @IsIn(DESCRIPTORS, { each: true })
  descriptors!: Descriptor[];

  @ApiPropertyOptional({ description: 'Radio en km (por defecto, el de configuración: 2.5)', example: 2.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  radius?: number;
}

export class RecommendationItemDto {
  @ApiProperty({ type: PlaceRefDto }) lugar!: PlaceRefDto;
  @ApiProperty({ example: 400 }) distancia_m!: number;
  @ApiProperty({ example: 1, description: 'Similitud de Jaccard J (0–1)' }) coincidencia!: number;
  @ApiProperty({ type: Number, nullable: true, example: 92 }) puntaje_promedio!: number | null;
  @ApiProperty({ example: 7 }) total_cataciones!: number;
  @ApiProperty({ enum: DESCRIPTORS, isArray: true }) descriptores!: string[];
  @ApiProperty({ type: [String], example: ['Frutos Rojos', 'Hibisco'] }) notas_coincidentes!: string[];
  @ApiProperty({ type: FeaturedTastingDto, nullable: true }) destacada!: FeaturedTastingDto | null;
  @ApiProperty({ example: 0.8538, description: 'S = 0.60·J + 0.25·(1 − d/R) + 0.15·(puntaje/100)' }) score!: number;
}

export class RecommendationResponseDto {
  @ApiProperty({ example: 2.5 }) radio_km!: number;
  @ApiProperty({ enum: DESCRIPTORS, isArray: true }) descriptores!: string[];
  @ApiProperty({ type: [RecommendationItemDto], description: 'Ordenado por score descendente' })
  resultados!: RecommendationItemDto[];
}
