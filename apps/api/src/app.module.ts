import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './domains/auth';
import { CatalogModule } from './domains/catalog';
import { PlacesModule } from './domains/places';
import { RecommendationsModule } from './domains/recommendations';
import { TastingsModule } from './domains/tastings';
import { UsersModule } from './domains/users';
import { AppConfigModule, TypedConfigService } from './shared/config';
import { DatabaseModule } from './shared/database';
import { HealthModule } from './shared/health/health.module';
import { AllExceptionsFilter } from './shared/http';
import { AppLoggerModule } from './shared/logging/logger.module';
import { JwtAuthGuard, RolesGuard, skipUnlessStrict, STRICT_THROTTLER } from './shared/security';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    DatabaseModule,
    ThrottlerModule.forRootAsync({
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => {
        const t = config.get('throttle');
        return {
          throttlers: [
            { name: 'default', ttl: t.ttlMs, limit: t.limit },
            { name: STRICT_THROTTLER, ttl: t.ttlMs, limit: t.authLimit, skipIf: skipUnlessStrict },
          ],
        };
      },
    }),
    HealthModule,
    // Dominios
    AuthModule,
    UsersModule,
    CatalogModule,
    PlacesModule,
    TastingsModule,
    RecommendationsModule,
  ],
  providers: [
    // Orden: rate limit → JWT → roles.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
