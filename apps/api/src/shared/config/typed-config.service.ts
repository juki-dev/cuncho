import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './app-config';

/** Acceso tipado a la configuración: `config.get('recommendation')`. */
@Injectable()
export class TypedConfigService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config.get(key, { infer: true });
  }
}
