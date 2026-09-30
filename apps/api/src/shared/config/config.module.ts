import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadAppConfig } from './app-config';
import { TypedConfigService } from './typed-config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // En test el entorno lo arma el propio test (Testcontainers).
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      load: [loadAppConfig],
    }),
  ],
  providers: [TypedConfigService],
  exports: [TypedConfigService],
})
export class AppConfigModule {}
