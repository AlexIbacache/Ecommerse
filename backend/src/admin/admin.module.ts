import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AdminAuditController } from './admin-audit.controller';
import { AdminCommentsController } from './admin-comments.controller';
import { AdminCommentsService } from './admin-comments.service';
import { AdminController } from './admin.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { AdminService } from './admin.service';

@Module({
  imports: [AuditModule],
  controllers: [
    AdminAuditController,
    AdminController,
    AdminOrdersController,
    AdminCommentsController,
  ],
  providers: [AdminService, AdminOrdersService, AdminCommentsService],
})
export class AdminModule {}
