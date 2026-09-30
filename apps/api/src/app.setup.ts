import { INestApplication, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { TypedConfigService } from './shared/config';
import { createValidationPipe } from './shared/http';

/** Configuración HTTP común a main.ts y a los tests e2e. */
export function configureApp(app: INestApplication): void {
  const config = app.get(TypedConfigService);
  const { globalPrefix, swaggerEnabled } = config.get('app');

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(globalPrefix, { exclude: [{ path: 'health', method: RequestMethod.GET }] });
  app.useGlobalPipes(createValidationPipe());
  app.use(helmet());
  app.enableCors({
    origin: config.get('cors').origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'X-Request-Id'],
    credentials: false,
    maxAge: 600,
  });
  app.enableShutdownHooks();

  if (swaggerEnabled) {
    const doc = new DocumentBuilder()
      .setTitle('Cuncho API')
      .setDescription('Cataciones de café geoposicionadas, mapa y recomendaciones.')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, doc), {
      jsonDocumentUrl: 'docs/openapi.json',
    });
  }
}
