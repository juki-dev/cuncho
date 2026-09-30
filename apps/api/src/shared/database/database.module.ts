import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypedConfigService } from '../config/typed-config.service';
import { buildTypeOrmOptions } from './typeorm-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => ({
        ...buildTypeOrmOptions(config.get('db')),
        // Las entidades las registra cada dominio con TypeOrmModule.forFeature.
        entities: [],
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
