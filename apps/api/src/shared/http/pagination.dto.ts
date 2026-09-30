import { Type as TransformType } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from '@nestjs/common';

export class CursorPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Cursor opaco devuelto como `siguiente_cursor` en la página anterior' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

export interface CursorPage<T> {
  items: T[];
  siguiente_cursor: string | null;
}

/** Crea la clase de respuesta paginada para Swagger: `PaginatedDto(TastingResponseDto)`. */
export function PaginatedDto<T>(item: Type<T>) {
  class Paginated implements CursorPage<T> {
    @ApiProperty({ type: item, isArray: true })
    items!: T[];

    @ApiProperty({ type: String, nullable: true, description: 'null si no hay más páginas' })
    siguiente_cursor!: string | null;
  }
  Object.defineProperty(Paginated, 'name', { value: `Paginated${item.name}` });
  return Paginated;
}
