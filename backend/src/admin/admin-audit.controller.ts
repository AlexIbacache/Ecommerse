import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '../auth/auth.constants';
import { AuditService } from '../audit/audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  adminPageQuerySchema,
  type AdminPageQueryDto,
} from './dto/admin-query.dto';

@Roles(Role.ADMINISTRADOR)
@Controller('admin/audit')
export class AdminAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminPageQuerySchema))
    query: AdminPageQueryDto,
  ) {
    return this.auditService.list(query);
  }
}
