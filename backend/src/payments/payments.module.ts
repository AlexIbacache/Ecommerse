import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaypalClient } from './paypal.client';

@Module({
  controllers: [PaymentsController],
  providers: [PaypalClient, PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
