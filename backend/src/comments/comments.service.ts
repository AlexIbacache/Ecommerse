import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Comment, User } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import type { CommentQueryDto } from './dto/comment-query.dto';
import type { CreateCommentDto } from './dto/create-comment.dto';
import { ratingBreakdown } from './ratings';

const USER_RATE_LIMIT = 5;
const USER_RATE_WINDOW_MS = 60_000;
// Un texto idéntico en el mismo producto dentro de esta ventana se considera repetido.
const DUPLICATE_WINDOW_MS = 10 * 60_000;

@Injectable()
export class CommentsService {
  private readonly userHits = new Map<number, number[]>();

  constructor(private readonly prisma: PrismaService) {}

  async create(
    productId: number,
    dto: CreateCommentDto,
    user?: AuthenticatedUser,
  ) {
    // Honeypot: un bot rellena el campo oculto. Se responde como si hubiera funcionado
    // (para no darle pistas) pero no se guarda nada.
    if (dto.website) {
      return {
        id: 0,
        content: dto.content,
        authorName: dto.guestName ?? 'Anónimo',
        isAnonymous: !user,
        rating: null,
        createdAt: new Date().toISOString(),
      };
    }

    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (!user && !dto.guestName) {
      throw new BadRequestException(
        'Indica un nombre para comentar como visitante',
      );
    }

    if (dto.rating !== undefined && !user) {
      throw new BadRequestException('Inicia sesión para puntuar este producto');
    }

    if (user) {
      this.checkUserRate(user.id);
    }

    const duplicate = await this.prisma.comment.findFirst({
      where: {
        productId,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
        content: { equals: dto.content, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        'Ya existe un comentario igual en este producto',
      );
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      if (dto.rating !== undefined && user) {
        // Serializa envíos simultáneos del mismo usuario para el mismo producto.
        await tx.$queryRaw`SELECT 1 FROM (SELECT pg_advisory_xact_lock(${user.id}::int, ${productId}::int)) AS lock`;

        const rated = await tx.comment.findFirst({
          where: { productId, userId: user.id, rating: { not: null } },
          select: { id: true },
        });

        if (rated) {
          throw new ConflictException('Ya puntuaste este producto');
        }
      }

      return tx.comment.create({
        data: {
          productId,
          userId: user?.id ?? null,
          guestName: user ? null : dto.guestName,
          content: dto.content,
          rating: dto.rating ?? null,
        },
        include: { user: true },
      });
    });

    return this.toPublic(comment);
  }

  async list(productId: number, query: CommentQueryDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const where = { productId, status: 'VISIBLE' as const };

    const [totalItems, comments, summary] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { user: true },
      }),
      ratingBreakdown(this.prisma, productId),
    ]);

    return {
      summary,
      data: comments.map((comment) => this.toPublic(comment)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  private checkUserRate(userId: number): void {
    const now = Date.now();
    const hits = (this.userHits.get(userId) ?? []).filter(
      (timestamp) => now - timestamp < USER_RATE_WINDOW_MS,
    );

    if (hits.length >= USER_RATE_LIMIT) {
      throw new HttpException(
        'Demasiados comentarios en poco tiempo',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    hits.push(now);
    this.userHits.set(userId, hits);
  }

  private toPublic(comment: Comment & { user: User | null }) {
    return {
      id: comment.id,
      content: comment.content,
      authorName: comment.user?.name ?? comment.guestName ?? 'Anónimo',
      isAnonymous: comment.userId === null,
      rating: comment.rating,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
