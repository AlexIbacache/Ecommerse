import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Algorithm, hash, verify } from '@node-rs/argon2';
import type { User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import type { Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.constants';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { signAccessToken } from './jwt';

const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Hash argon2id de un valor fijo: se usa para igualar el tiempo de respuesta
// cuando el email no existe y evitar enumeración por timing.
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$UfLKWWW/rIQyts3bAppeaw$j19V4uJgaGTF31rCGLWE392p7wJg/N7OE/n5eGmOlR4';

export interface SafeUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

type UserWithRole = User & { role: { name: string } };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const clientRole = await this.prisma.role.findUnique({
      where: { name: 'CLIENTE' },
    });

    if (!clientRole) {
      throw new InternalServerErrorException('Rol CLIENTE no configurado');
    }

    const passwordHash = await hash(dto.password, ARGON2_OPTIONS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        roleId: clientRole.id,
      },
      include: { role: true },
    });

    return this.toSafeUser(user);
  }

  async login(dto: LoginDto, res: Response): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    const passwordHash = user?.passwordHash ?? DUMMY_HASH;
    const valid = await verify(passwordHash, dto.password);

    if (!user || !valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.issueSession(user, res);

    return this.toSafeUser(user);
  }

  async refresh(refreshToken: string | undefined, res: Response): Promise<{ ok: boolean }> {
    if (!refreshToken) {
      throw new UnauthorizedException('No autenticado');
    }

    const refreshHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: refreshHash },
      include: { user: { include: { role: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    // Rotación: la sesión usada queda revocada.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    await this.issueSession(session.user, res);

    return { ok: true };
  }

  async logout(refreshToken: string | undefined, res: Response): Promise<{ ok: boolean }> {
    if (refreshToken) {
      const refreshHash = this.hashToken(refreshToken);
      await this.prisma.session.updateMany({
        where: { refreshTokenHash: refreshHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });

    return { ok: true };
  }

  async me(userId: number): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('No autenticado');
    }

    return this.toSafeUser(user);
  }

  private async issueSession(user: UserWithRole, res: Response): Promise<void> {
    const accessTtl = this.config.getOrThrow<number>('JWT_ACCESS_TTL');
    const refreshTtl = this.config.getOrThrow<number>('JWT_REFRESH_TTL');
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');

    const accessToken = await signAccessToken(user.id, user.role.name, accessSecret, accessTtl);

    const refreshToken = randomBytes(32).toString('hex');
    const refreshHash = this.hashToken(refreshToken);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: refreshHash,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    res.cookie(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: accessTtl * 1000,
    });

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/auth',
      maxAge: refreshTtl * 1000,
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toSafeUser(user: UserWithRole): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
    };
  }
}
