import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponses, ErrorResponseDto } from '../../../shared/http';
import { CurrentUser, Public } from '../../../shared/security';
import type { AuthenticatedUser } from '../../../shared/types';
import { PlacesService } from '../application/places.service';
import {
  BBoxQueryDto,
  CreatePlaceDto,
  DuplicatePlaceDetailsDto,
  NearbyPlaceDto,
  NearbyQueryDto,
  PlaceDto,
} from './places.dto';

@ApiTags('places')
@ApiExtraModels(DuplicatePlaceDetailsDto)
@Controller('places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Pines del mapa visible (bbox), con puntaje promedio' })
  @ApiOkResponse({ type: [PlaceDto] })
  @ApiErrorResponses(400)
  list(@Query() q: BBoxQueryDto): Promise<PlaceDto[]> {
    return this.places.listInBBox(q.bbox);
  }

  @ApiBearerAuth()
  @Get('nearby')
  @ApiOperation({ summary: 'Lugares cercanos ordenados por distancia (paso 1 de la catación)' })
  @ApiOkResponse({ type: [NearbyPlaceDto] })
  @ApiErrorResponses(400, 401)
  nearby(@Query() q: NearbyQueryDto): Promise<NearbyPlaceDto[]> {
    return this.places.nearby(q.lat, q.lng, q.radius);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear lugar; 409 si hay uno a menos de ~30 m con nombre parecido' })
  @ApiCreatedResponse({ type: PlaceDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: '`details.lugar_existente` contiene el lugar duplicado (DuplicatePlaceDetailsDto)',
  })
  @ApiErrorResponses(400, 401)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlaceDto): Promise<PlaceDto> {
    return this.places.create(user, dto);
  }
}
