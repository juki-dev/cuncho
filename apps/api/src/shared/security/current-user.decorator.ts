import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../types/authenticated-user';

/** Inyecta el usuario autenticado (`request.user`). */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const req = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
  if (!req.user) throw new UnauthorizedException();
  return req.user;
});
