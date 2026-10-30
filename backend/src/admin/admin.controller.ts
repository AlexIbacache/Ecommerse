import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '../auth/auth.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminService } from './admin.service';
import {
  dailySalesQuerySchema,
  type DailySalesQueryDto,
} from './dto/admin-query.dto';

@Roles(Role.ADMINISTRADOR)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  metrics() {
    return this.adminService.metrics();
  }

  @Get('sales/daily')
  dailySales(
    @Query(new ZodValidationPipe(dailySalesQuerySchema))
    query: DailySalesQueryDto,
  ) {
    return this.adminService.dailySales(query.days);
  }
}
