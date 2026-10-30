import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { Role } from '../auth/auth.constants';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminCommentsService } from './admin-comments.service';
import {
  adminPageQuerySchema,
  updateCommentStatusSchema,
  type AdminPageQueryDto,
  type UpdateCommentStatusDto,
} from './dto/admin-query.dto';

@Roles(Role.ADMINISTRADOR)
@Controller('admin/comments')
export class AdminCommentsController {
  constructor(private readonly adminCommentsService: AdminCommentsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminPageQuerySchema))
    query: AdminPageQueryDto,
  ) {
    return this.adminCommentsService.list(query);
  }

  @Patch(':id')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateCommentStatusSchema))
    dto: UpdateCommentStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminCommentsService.setStatus(id, dto.status, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminCommentsService.remove(id, user.id);
  }
}
