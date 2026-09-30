import { ApiProperty } from '@nestjs/swagger';
import { ACIDITY_TYPES, BREW_METHODS, DESCRIPTORS, PROCESSES, SCALES } from '../domain/catalog';

export class AcidityOptionDto {
  @ApiProperty({ enum: [1, 2, 3, 4, 5], example: 3 }) nivel!: number;
  @ApiProperty({ enum: ACIDITY_TYPES, example: 'Cítrica' }) tipo!: string;
  @ApiProperty({ example: 'Cítrica' }) etiqueta!: string;
}

export class NoteOptionDto {
  @ApiProperty({ example: 'Frutos Rojos' }) nombre!: string;
  @ApiProperty({ enum: DESCRIPTORS, example: 'frutal' }) descriptor!: string;
}

export class DescriptorOptionDto {
  @ApiProperty({ enum: DESCRIPTORS, example: 'frutal' }) id!: string;
  @ApiProperty({ example: 'Frutal / Cítrico' }) etiqueta!: string;
  @ApiProperty({ example: 'Frutos rojos, naranja' }) pista!: string;
}

export class ScaleOptionDto {
  @ApiProperty({ enum: SCALES, example: 'SCA' }) id!: string;
  @ApiProperty({ example: 0 }) min!: number;
  @ApiProperty({ example: 100 }) max!: number;
  @ApiProperty({ example: 0.25 }) paso!: number;
}

export class CatalogResponseDto {
  @ApiProperty({ type: [String], description: 'Sugerencias; la variedad es texto libre', example: ['Geisha', 'Caturra'] })
  variedades!: string[];

  @ApiProperty({ enum: PROCESSES, isArray: true }) procesos!: string[];
  @ApiProperty({ enum: BREW_METHODS, isArray: true }) metodos!: string[];
  @ApiProperty({ type: [AcidityOptionDto] }) acidez!: AcidityOptionDto[];
  @ApiProperty({ type: [NoteOptionDto] }) notas!: NoteOptionDto[];
  @ApiProperty({ type: [DescriptorOptionDto] }) descriptores!: DescriptorOptionDto[];
  @ApiProperty({ type: [ScaleOptionDto] }) escalas!: ScaleOptionDto[];
}
