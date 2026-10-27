import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { ValidateCartDto } from './dto/validate-cart.dto';

function toCents(value: string | { toString(): string }): number {
  return Math.round(Number(value.toString()) * 100);
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(dto: ValidateCartDto) {
    const ids = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    const items = dto.items.map((item) => {
      const product = byId.get(item.productId);

      if (!product) {
        return {
          productId: item.productId,
          requestedQuantity: item.quantity,
          priceChanged: false,
          issue: 'NOT_FOUND' as const,
        };
      }

      let issue: 'INACTIVE' | 'INSUFFICIENT_STOCK' | undefined;

      if (!product.isActive) {
        issue = 'INACTIVE';
      } else if (product.stock < item.quantity) {
        issue = 'INSUFFICIENT_STOCK';
      }

      const priceChanged =
        item.expectedPrice !== undefined &&
        toCents(item.expectedPrice) !== toCents(product.price);

      return {
        productId: product.id,
        requestedQuantity: item.quantity,
        name: product.name,
        slug: product.slug,
        price: product.price.toString(),
        stock: product.stock,
        isActive: product.isActive,
        available: product.isActive && product.stock > 0,
        priceChanged,
        issue,
      };
    });

    return {
      valid: items.every((item) => !item.issue),
      items,
    };
  }
}
