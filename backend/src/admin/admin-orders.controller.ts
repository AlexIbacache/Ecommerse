import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Role } from '../auth/auth.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminOrdersService } from './admin-orders.service';
import {
  adminPageQuerySchema,
  type AdminPageQueryDto,
} from './dto/admin-query.dto';

@Roles(Role.ADMINISTRADOR)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminPageQuerySchema)) query: AdminPageQueryDto,
  ) {
    return this.adminOrdersService.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.adminOrdersService.findById(id);
  }
}
