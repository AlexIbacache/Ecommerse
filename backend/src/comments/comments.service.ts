import {
  BadRequestException,
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

const USER_RATE_LIMIT = 5;
const USER_RATE_WINDOW_MS = 60_000;

@Injectable()
export class CommentsService {
  private readonly userHits = new Map<number, number[]>();

  constructor(private readonly prisma: PrismaService) {}

  async create(
    productId: number,
    dto: CreateCommentDto,
    user?: AuthenticatedUser,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (!user && !dto.guestName) {
      throw new BadRequestException(
        'Indicá un nombre para comentar como visitante',
      );
    }

    if (user) {
      this.checkUserRate(user.id);
    }

    const comment = await this.prisma.comment.create({
      data: {
        productId,
        userId: user?.id ?? null,
        guestName: user ? null : dto.guestName,
        content: dto.content,
      },
      include: { user: true },
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

    const [totalItems, comments] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { user: true },
      }),
    ]);

    return {
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
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
