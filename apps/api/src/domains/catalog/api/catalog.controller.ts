import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../shared/security';
import { CatalogService } from '../application/catalog.service';
import { CatalogResponseDto } from './catalog-response.dto';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ summary: 'Listas cerradas: variedades, procesos, métodos, acidez, notas y descriptores' })
  @ApiOkResponse({ type: CatalogResponseDto })
  getCatalog(): CatalogResponseDto {
    return this.catalog.getCatalog();
  }
}
