import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ACIDITY_TYPES, BREW_METHODS, DESCRIPTORS, PROCESSES, SCALES } from '../../catalog';
import type { AcidityLevel, AcidityType, BrewMethod, Process, Scale } from '../../catalog';
import { PaginatedDto } from '../../../shared/http';
import { PlaceRefDto } from '../../places';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// ---------- request ----------

export class TastingPlaceInputDto {
  @ApiProperty({ format: 'uuid', description: 'Lugar existente (créalo antes con POST /places)' })
  @IsUUID()
  id!: string;

  @ApiPropertyOptional({ description: 'Ignorado: se usa el nombre guardado en el servidor' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ description: 'Ignorado' })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ description: 'Ignorado' })
  @IsOptional()
  @IsLongitude()
  lng?: number;
}

export class GrainDto {
  @ApiProperty({ example: 'Bourbon Rosado', maxLength: 80 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  variedad!: string;

  @ApiPropertyOptional({ example: 'Finca El Paraíso', maxLength: 120 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  finca?: string;

  @ApiPropertyOptional({ example: 'Pitalito, Huila', maxLength: 120 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  region?: string;

  @ApiProperty({ enum: PROCESSES, example: 'Anaeróbico' })
  @IsIn(PROCESSES)
  proceso!: Process;

  @ApiProperty({ enum: BREW_METHODS, example: 'Aeropress' })
  @IsIn(BREW_METHODS)
  metodo!: BrewMethod;
}

export class AcidityDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 3 })
  @IsInt()
  @Min(1)
  @Max(5)
  nivel!: AcidityLevel;

  @ApiProperty({ enum: ACIDITY_TYPES, example: 'Cítrica' })
  @IsIn(ACIDITY_TYPES)
  tipo!: AcidityType;
}

export class SensoryInputDto {
  @ApiProperty({ type: AcidityDto })
  @ValidateNested()
  @Type(() => AcidityDto)
  acidez!: AcidityDto;

  @ApiProperty({ type: [String], example: ['Frutos Rojos', 'Hibisco', 'Cítricos'], description: 'Notas del catálogo' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  notas!: string[];

  @ApiPropertyOptional({
    enum: DESCRIPTORS,
    isArray: true,
    description: 'Ignorado: el servidor deriva los descriptores de las notas',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  descriptores?: string[];

  @ApiProperty({ example: 92, description: 'SCA: 0–100 en pasos de 0.25 · Personal: 1–10 en pasos de 0.5' })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  puntaje!: number;

  @ApiProperty({ enum: SCALES, example: 'SCA' })
  @IsIn(SCALES)
  escala!: Scale;
}

export class CreateTastingDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Id generado por el cliente para reintentos idempotentes (alternativa al header Idempotency-Key)',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ example: '2026-09-28T16:40:00-05:00', description: 'Momento de la catación; por defecto, ahora' })
  @IsOptional()
  @IsISO8601({ strict: true })
  creado_en?: string;

  @ApiProperty({ type: TastingPlaceInputDto })
  @ValidateNested()
  @Type(() => TastingPlaceInputDto)
  lugar!: TastingPlaceInputDto;

  @ApiProperty({ type: GrainDto })
  @ValidateNested()
  @Type(() => GrainDto)
  grano!: GrainDto;

  @ApiProperty({ type: SensoryInputDto })
  @ValidateNested()
  @Type(() => SensoryInputDto)
  sensorial!: SensoryInputDto;
}

// ---------- response ----------

export class GrainResponseDto {
  @ApiProperty({ example: 'Bourbon Rosado' }) variedad!: string;
  @ApiProperty({ type: String, nullable: true, example: 'Finca El Paraíso' }) finca!: string | null;
  @ApiProperty({ type: String, nullable: true, example: 'Pitalito, Huila' }) region!: string | null;
  @ApiProperty({ enum: PROCESSES }) proceso!: string;
  @ApiProperty({ enum: BREW_METHODS }) metodo!: string;
}

export class SensoryResponseDto {
  @ApiProperty({ type: AcidityDto }) acidez!: AcidityDto;
  @ApiProperty({ type: [String] }) notas!: string[];
  @ApiProperty({ enum: DESCRIPTORS, isArray: true }) descriptores!: string[];
  @ApiProperty({ example: 92 }) puntaje!: number;
  @ApiProperty({ enum: SCALES }) escala!: string;
  @ApiProperty({ example: 92, description: 'Puntaje llevado a 0–100' }) puntaje_normalizado!: number;
}

export class TastingResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) usuario_id!: string;
  @ApiProperty({ example: '2026-09-28T21:40:00.000Z' }) creado_en!: string;
  @ApiProperty({ type: PlaceRefDto }) lugar!: PlaceRefDto;
  @ApiProperty({ type: GrainResponseDto }) grano!: GrainResponseDto;
  @ApiProperty({ type: SensoryResponseDto }) sensorial!: SensoryResponseDto;
}

export class TastingPageDto extends PaginatedDto(TastingResponseDto) {}

export class CountByKeyDto {
  @ApiProperty({ example: 'frutal' }) clave!: string;
  @ApiProperty({ example: 4 }) total!: number;
}

export class TastingStatsDto {
  @ApiProperty({ example: 12 }) total_cataciones!: number;
  @ApiProperty({ type: Number, nullable: true, example: 87.75 }) puntaje_promedio!: number | null;
  @ApiProperty({ example: 5 }) lugares_visitados!: number;
  @ApiProperty({ type: String, nullable: true }) ultima_catacion_en!: string | null;
  @ApiProperty({ type: [CountByKeyDto] }) por_descriptor!: CountByKeyDto[];
  @ApiProperty({ type: [CountByKeyDto] }) por_metodo!: CountByKeyDto[];
  @ApiProperty({ type: [CountByKeyDto] }) por_proceso!: CountByKeyDto[];
}
