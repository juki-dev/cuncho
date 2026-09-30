import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../../shared/http';
import { CurrentUser } from '../../../shared/security';
import type { AuthenticatedUser } from '../../../shared/types';
import { UsersService } from '../application/users.service';
import { UserProfileDto } from './user-profile.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiErrorResponses(401, 404)
  async me(@CurrentUser() current: AuthenticatedUser): Promise<UserProfileDto> {
    const user = await this.users.findById(current.id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return UserProfileDto.from(user);
  }
}
