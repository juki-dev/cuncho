import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../../shared/http';
import { Public, StrictRateLimit } from '../../../shared/security';
import { AuthService } from '../application/auth.service';
import { AuthTokensDto, LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';

@ApiTags('auth')
@Public()
@StrictRateLimit()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Crear cuenta' })
  @ApiCreatedResponse({ type: AuthTokensDto })
  @ApiErrorResponses(400, 409, 429)
  register(@Body() dto: RegisterDto): Promise<AuthTokensDto> {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiErrorResponses(400, 401, 429)
  login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotar refresh token y obtener un access token nuevo' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiErrorResponses(400, 401, 429)
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.auth.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión (revoca la familia del refresh token)' })
  @ApiNoContentResponse()
  @ApiErrorResponses(400, 429)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.auth.logout(dto.refresh_token);
  }
}
