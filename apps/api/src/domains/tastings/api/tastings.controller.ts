import { Body, Controller, Get, Headers, HttpStatus, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiErrorResponses, CursorPage, CursorPaginationQueryDto } from '../../../shared/http';
import { CurrentUser } from '../../../shared/security';
import type { AuthenticatedUser } from '../../../shared/types';
import { TastingsService } from '../application/tastings.service';
import { CreateTastingDto, TastingPageDto, TastingResponseDto, TastingStatsDto } from './tastings.dto';

@ApiTags('tastings')
@ApiBearerAuth()
@Controller('tastings')
export class TastingsController {
  constructor(private readonly tastings: TastingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear catación (idempotente)',
    description:
      'Si llega un `id` (o header `Idempotency-Key`) que ya existe para el usuario, devuelve la catación existente con 200.',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'UUID; equivale a enviar `id` en el cuerpo' })
  @ApiCreatedResponse({ type: TastingResponseDto, description: 'Catación creada' })
  @ApiOkResponse({ type: TastingResponseDto, description: 'Reintento: ya existía' })
  @ApiErrorResponses(400, 401, 404, 409)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTastingDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TastingResponseDto> {
    const { created, tasting } = await this.tastings.create(user, dto, idempotencyKey);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return tasting;
  }

  @Get('me')
  @ApiOperation({ summary: 'Bitácora del usuario (más recientes primero, paginación por cursor)' })
  @ApiOkResponse({ type: TastingPageDto })
  @ApiErrorResponses(400, 401)
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() q: CursorPaginationQueryDto,
  ): Promise<CursorPage<TastingResponseDto>> {
    return this.tastings.listMine(user, q.cursor, q.limit);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Estadísticas de la bitácora del usuario' })
  @ApiOkResponse({ type: TastingStatsDto })
  @ApiErrorResponses(401)
  statsMine(@CurrentUser() user: AuthenticatedUser): Promise<TastingStatsDto> {
    return this.tastings.statsMine(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una catación propia' })
  @ApiOkResponse({ type: TastingResponseDto })
  @ApiErrorResponses(400, 401, 404)
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TastingResponseDto> {
    return this.tastings.getById(user, id);
  }
}
