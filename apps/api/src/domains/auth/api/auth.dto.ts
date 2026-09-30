import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'una-clave-larga' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Ana', maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nombre!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'una-clave-larga' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token recibido en login/refresh' })
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  refresh_token!: string;
}

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() nombre!: string;
}

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT de acceso (Bearer)' }) access_token!: string;
  @ApiProperty({ description: 'Segundos de vida del access token', example: 900 }) expires_in!: number;
  @ApiProperty({ description: 'Token opaco; se rota en cada /auth/refresh' }) refresh_token!: string;
  @ApiProperty({ example: 'Bearer' }) token_type!: 'Bearer';
  @ApiProperty({ type: AuthUserDto }) usuario!: AuthUserDto;
}
