import { Controller, Get } from '@nestjs/common';
import { Role } from '../auth/auth.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Roles(Role.ADMINISTRADOR)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  metrics() {
    return this.adminService.metrics();
  }
}
