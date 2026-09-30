import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Formato único de error de la API. */
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({ example: 'Datos de entrada inválidos' })
  message!: string;

  @ApiPropertyOptional({
    description: 'Información adicional, p. ej. errores de validación por campo',
    example: [{ field: 'sensorial.puntaje', errors: ['puntaje fuera de rango para la escala SCA'] }],
  })
  details?: unknown;
}

export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}
