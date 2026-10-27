import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { ProductQueryDto } from './dto/product-query.dto';

const ORDER_BY: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  name_asc: { name: 'asc' },
  createdAt_desc: { createdAt: 'desc' },
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductQueryDto) {
    const { q, category, sort, page, pageSize } = query;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      ...(category ? { category: { slug: category } } : {}),
    };

    const orderBy = ORDER_BY[sort] ?? ORDER_BY.createdAt_desc;

    const [totalItems, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          images: { orderBy: { position: 'asc' }, take: 1 },
        },
      }),
    ]);

    return {
      data: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price.toString(),
        stock: product.stock,
        available: product.isActive && product.stock > 0,
        image: product.images[0]?.url ?? null,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        },
      })),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock,
      available: product.isActive && product.stock > 0,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      images: product.images.map((image) => ({
        id: image.id,
        url: image.url,
        position: image.position,
      })),
    };
  }
}
