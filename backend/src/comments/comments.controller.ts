import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalAuth } from '../common/decorators/optional-auth.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CommentsService } from './comments.service';
import {
  commentQuerySchema,
  type CommentQueryDto,
} from './dto/comment-query.dto';
import {
  createCommentSchema,
  type CreateCommentDto,
} from './dto/create-comment.dto';

@Controller('products')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get(':productId/comments')
  list(
    @Param('productId', ParseIntPipe) productId: number,
    @Query(new ZodValidationPipe(commentQuerySchema)) query: CommentQueryDto,
  ) {
    return this.commentsService.list(productId, query);
  }

  @OptionalAuth()
  @Post(':productId/comments')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(
    @Param('productId', ParseIntPipe) productId: number,
    @Body(new ZodValidationPipe(createCommentSchema)) dto: CreateCommentDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.commentsService.create(productId, dto, user);
  }
}
