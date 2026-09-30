import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlacesController } from './api/places.controller';
import { PlacesService } from './application/places.service';
import { PlaceEntity } from './infrastructure/place.entity';
import { PlacesRepository } from './infrastructure/places.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PlaceEntity])],
  controllers: [PlacesController],
  providers: [PlacesService, PlacesRepository],
  exports: [PlacesService],
})
export class PlacesModule {}
