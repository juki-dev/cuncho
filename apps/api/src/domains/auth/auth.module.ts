import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypedConfigService } from '../../shared/config';
import { UsersModule } from '../users';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { COGNITO_VERIFIER, JoseCognitoVerifier } from './infrastructure/cognito-verifier';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { RefreshTokenEntity } from './infrastructure/refresh-token.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    JwtModule.registerAsync({
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => ({
        secret: config.get('jwt').accessSecret,
        signOptions: { expiresIn: config.get('jwt').accessTtlSeconds, algorithm: 'HS256' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, { provide: COGNITO_VERIFIER, useClass: JoseCognitoVerifier }],
})
export class AuthModule {}
