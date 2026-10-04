import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { TypedConfigService } from '../../../shared/config';

export interface CognitoIdentity {
  sub: string;
  email: string;
  name: string;
}

/** Token de inyección para poder sustituir el verificador en las pruebas. */
export const COGNITO_VERIFIER = Symbol('COGNITO_VERIFIER');

export interface CognitoVerifier {
  readonly enabled: boolean;
  /** Valida el ID token emitido por Cognito y devuelve la identidad. Lanza 401 si no es válido. */
  verify(idToken: string): Promise<CognitoIdentity>;
}

const INVALID = 'Token de Google inválido o expirado';

@Injectable()
export class JoseCognitoVerifier implements CognitoVerifier {
  private readonly cfg: { issuer: string; clientId: string } | null;
  private keys?: JWTVerifyGetKey;

  constructor(config: TypedConfigService) {
    this.cfg = config.get('cognito');
  }

  /** Solo para pruebas: JWKS local. En producción las llaves se descargan de Cognito y se cachean. */
  useKeysForTesting(keys: JWTVerifyGetKey): this {
    this.keys = keys;
    return this;
  }

  get enabled(): boolean {
    return this.cfg !== null;
  }

  async verify(idToken: string): Promise<CognitoIdentity> {
    if (!this.cfg) throw new UnauthorizedException(INVALID);
    const { issuer, clientId } = this.cfg;
    this.keys ??= createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
    try {
      const { payload } = await jwtVerify(idToken, this.keys, { issuer, audience: clientId, algorithms: ['RS256'] });
      const verified = payload.email_verified === true || payload.email_verified === 'true';
      if (payload.token_use !== 'id' || typeof payload.sub !== 'string' || typeof payload.email !== 'string' || !verified) {
        throw new Error('claims inválidos');
      }
      return { sub: payload.sub, email: payload.email, name: typeof payload.name === 'string' ? payload.name : '' };
    } catch {
      throw new UnauthorizedException(INVALID);
    }
  }
}
