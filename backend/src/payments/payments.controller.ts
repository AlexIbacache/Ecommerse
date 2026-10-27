import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  capturePaymentSchema,
  type CapturePaymentDto,
} from './dto/capture-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('capture')
  capture(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(capturePaymentSchema)) dto: CapturePaymentDto,
  ) {
    return this.paymentsService.capture(user.id, dto);
  }
}
