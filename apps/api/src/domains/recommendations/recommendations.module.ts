import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog';
import { PlacesModule } from '../places';
import { RecommendationsController } from './api/recommendations.controller';
import { RecommendationsService } from './application/recommendations.service';

@Module({
  imports: [PlacesModule, CatalogModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
