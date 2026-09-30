import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { NodeEnv } from '../config/env.validation';
import { TypedConfigService } from '../config/typed-config.service';

/** Parámetros de query que nunca deben quedar en logs (coordenadas del usuario, cursores, tokens). */
const SENSITIVE_QUERY = new Set(['lat', 'lng', 'bbox', 'cursor', 'token', 'refresh_token']);

export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  const q = url.indexOf('?');
  if (q < 0) return url;
  const params = new URLSearchParams(url.slice(q + 1));
  for (const key of [...params.keys()]) if (SENSITIVE_QUERY.has(key)) params.set(key, '[redacted]');
  return `${url.slice(0, q)}?${params.toString()}`;
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => {
        const app = config.get('app');
        return {
          pinoHttp: {
            level: app.logLevel,
            genReqId: (req: IncomingMessage) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
            // Nunca registrar contraseñas, tokens ni cuerpos (que pueden traer coordenadas).
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', '*.password', '*.refresh_token', '*.access_token'],
              censor: '[redacted]',
            },
            serializers: {
              req: (req: { id: string; method: string; url: string }) => ({
                id: req.id,
                method: req.method,
                url: sanitizeUrl(req.url),
              }),
            },
            autoLogging: { ignore: (req: IncomingMessage) => req.url === '/health' },
            transport:
              app.env === NodeEnv.Development ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
          },
        };
      },
    }),
  ],
})
export class AppLoggerModule {}
