import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import type { AdminPageQueryDto } from './dto/admin-query.dto';

@Injectable()
export class AdminCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: AdminPageQueryDto) {
    const [totalItems, comments] = await Promise.all([
      this.prisma.comment.count(),
      this.prisma.comment.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          user: true,
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    return {
      data: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        authorName: comment.user?.name ?? comment.guestName ?? 'Anónimo',
        isAnonymous: comment.userId === null,
        status: comment.status,
        createdAt: comment.createdAt.toISOString(),
        product: comment.product,
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  async setStatus(id: number, status: 'VISIBLE' | 'OCULTO', actorId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { product: { select: { name: true } } },
    });

    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.comment.update({
        where: { id },
        data: { status },
      });

      if (comment.status !== status) {
        await this.audit.record(tx, {
          actorId,
          action: status === 'OCULTO' ? 'COMMENT_HIDDEN' : 'COMMENT_RESTORED',
          entityType: 'COMMENT',
          entityId: id,
          summary: comment.product.name,
        });
      }

      return result;
    });

    return { id: updated.id, status: updated.status };
  }

  async remove(id: number, actorId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { product: { select: { name: true } } },
    });

    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.delete({ where: { id } });
      await this.audit.record(tx, {
        actorId,
        action: 'COMMENT_DELETED',
        entityType: 'COMMENT',
        entityId: id,
        summary: comment.product.name,
      });
    });

    return { deleted: true };
  }
}
