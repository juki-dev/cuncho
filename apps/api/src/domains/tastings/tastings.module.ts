import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog';
import { PlacesModule } from '../places';
import { TastingsController } from './api/tastings.controller';
import { TastingsService } from './application/tastings.service';
import { TastingEntity } from './infrastructure/tasting.entity';
import { TastingsRepository } from './infrastructure/tastings.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TastingEntity]), PlacesModule, CatalogModule],
  controllers: [TastingsController],
  providers: [TastingsService, TastingsRepository],
})
export class TastingsModule {}
