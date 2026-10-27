import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  productQuerySchema,
  type ProductQueryDto,
} from './dto/product-query.dto';
import { ProductsService } from './products.service';

@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(productQuerySchema)) query: ProductQueryDto,
  ) {
    return this.productsService.list(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
