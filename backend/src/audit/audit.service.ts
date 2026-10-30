import { Injectable } from '@nestjs/common';
import { Prisma, type AuditAction } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AdminPageQueryDto } from '../admin/dto/admin-query.dto';

export interface AuditEntry {
  actorId: number;
  action: AuditAction;
  entityType: 'PRODUCT' | 'COMMENT';
  entityId: number;
  /** Nombre del producto afectado. No incluir contenido de usuarios. */
  summary: string;
  details?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una acción. Recibe el cliente para poder ejecutarse dentro de la
   * misma transacción que la operación auditada: o se guardan ambas o ninguna.
   */
  async record(client: Prisma.TransactionClient, entry: AuditEntry) {
    await client.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        summary: entry.summary.slice(0, 255),
        details: entry.details?.slice(0, 255),
      },
    });
  }

  async list(query: AdminPageQueryDto) {
    const [totalItems, logs] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        summary: log.summary,
        details: log.details,
        actor: log.actor,
        createdAt: log.createdAt.toISOString(),
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }
}
