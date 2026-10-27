import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica que la base de datos acepte conexiones y responda consultas.
   * Lanza si la base no está disponible; el controller lo traduce a 503.
   */
  async checkDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
