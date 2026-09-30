import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../../shared/http';
import { RecommendationsService } from '../application/recommendations.service';
import { RecommendationQueryDto, RecommendationResponseDto } from './recommendations.dto';

@ApiTags('recommendations')
@ApiBearerAuth()
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get()
  @ApiOperation({ summary: 'Ranking de lugares por descriptores, distancia y puntaje' })
  @ApiQuery({ name: 'descriptors', type: String, example: 'frutal,floral' })
  @ApiOkResponse({ type: RecommendationResponseDto })
  @ApiErrorResponses(400, 401)
  recommend(@Query() q: RecommendationQueryDto): Promise<RecommendationResponseDto> {
    return this.recommendations.recommend(q);
  }
}
