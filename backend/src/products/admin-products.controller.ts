import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '../auth/auth.constants';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminProductsService } from './admin-products.service';
import {
  adminProductQuerySchema,
  createProductSchema,
  updateProductSchema,
  type AdminProductQueryDto,
  type CreateProductDto,
  type UpdateProductDto,
} from './dto/admin-product.dto';

@Roles(Role.ADMINISTRADOR)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminProductQuerySchema))
    query: AdminProductQueryDto,
  ) {
    return this.adminProductsService.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductsService.findById(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductDto,
  ) {
    return this.adminProductsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductDto,
  ) {
    return this.adminProductsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductsService.remove(id);
  }
}
