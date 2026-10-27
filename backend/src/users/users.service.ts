import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { requireOwnershipOrAdmin } from '../common/utils/ownership';
import { PrismaService } from '../database/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toSafeUser(user);
  }

  async updateMe(userId: number, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existing && existing.id !== userId) {
        throw new ConflictException('Ese email ya está registrado');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
      },
      include: { role: true },
    });

    return this.toSafeUser(user);
  }

  async findOneForUser(current: AuthenticatedUser, id: number) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!target) {
      throw new NotFoundException('Recurso no encontrado');
    }

    requireOwnershipOrAdmin(current, target.id);

    return this.toSafeUser(target);
  }

  private toSafeUser(user: {
    id: number;
    email: string;
    name: string;
    role: { name: string };
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
    };
  }
}
