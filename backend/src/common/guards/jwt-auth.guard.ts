import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ACCESS_COOKIE, IS_PUBLIC_KEY, OPTIONAL_AUTH_KEY } from '../../auth/auth.constants';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { verifyAccessToken } from '../../auth/jwt';
import { parseCookies } from '../utils/cookies';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const optionalAuth = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<Request>();
    const token = parseCookies(request.headers.cookie)[ACCESS_COOKIE];

    if (!token) {
      if (optionalAuth) {
        return true;
      }
      throw new UnauthorizedException('No autenticado');
    }

    try {
      const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
      const payload = await verifyAccessToken(token, secret);

      (request as Request & { user: AuthenticatedUser }).user = {
        id: Number(payload.sub),
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
  }
}
