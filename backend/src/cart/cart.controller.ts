import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CartService } from './cart.service';
import {
  validateCartSchema,
  type ValidateCartDto,
} from './dto/validate-cart.dto';

@Public()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  validate(
    @Body(new ZodValidationPipe(validateCartSchema)) dto: ValidateCartDto,
  ) {
    return this.cartService.validate(dto);
  }
}
