import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import type {
  AdminProductQueryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/admin-product.dto';

const ORDER_BY: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  createdAt_desc: { createdAt: 'desc' },
  name_asc: { name: 'asc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  stock_asc: { stock: 'asc' },
};

const FIELD_LABELS: Record<string, string> = {
  name: 'nombre',
  description: 'descripción',
  price: 'precio',
  categoryId: 'categoría',
  stock: 'stock',
  isActive: 'estado',
  images: 'imágenes',
};

@Injectable()
export class AdminProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: AdminProductQueryDto) {
    const { q, category, sort, page, pageSize } = query;

    const where: Prisma.ProductWhereInput = {
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
        isActive: product.isActive,
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

  async findById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: { orderBy: { position: 'asc' } } },
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
      isActive: product.isActive,
      categoryId: product.categoryId,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      images: product.images.map((image) => image.url),
    };
  }

  async create(dto: CreateProductDto, actorId: number) {
    await this.assertCategory(dto.categoryId);

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: dto.name,
          slug: this.toSlug(dto.name),
          description: dto.description,
          price: dto.price.toFixed(2),
          stock: dto.stock,
          isActive: dto.isActive,
          categoryId: dto.categoryId,
          images: {
            create: dto.images.map((url, index) => ({ url, position: index })),
          },
        },
        include: { category: true, images: { orderBy: { position: 'asc' } } },
      });

      await this.audit.record(tx, {
        actorId,
        action: 'PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: created.id,
        summary: created.name,
      });

      return created;
    });

    return this.toAdminDetail(product);
  }

  async update(id: number, dto: UpdateProductDto, actorId: number) {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (dto.categoryId !== undefined) {
      await this.assertCategory(dto.categoryId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.price !== undefined ? { price: dto.price.toFixed(2) } : {}),
          ...(dto.categoryId !== undefined
            ? { categoryId: dto.categoryId }
            : {}),
          ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      if (dto.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: dto.images.map((url, index) => ({
            productId: id,
            url,
            position: index,
          })),
        });
      }

      const changed = Object.keys(dto)
        .filter((key) => dto[key as keyof UpdateProductDto] !== undefined)
        .map((key) => FIELD_LABELS[key] ?? key);

      await this.audit.record(tx, {
        actorId,
        action: 'PRODUCT_UPDATED',
        entityType: 'PRODUCT',
        entityId: id,
        summary: dto.name ?? existing.name,
        details:
          changed.length > 0 ? 'Cambios: ' + changed.join(', ') : undefined,
      });
    });

    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: { category: true, images: { orderBy: { position: 'asc' } } },
    });

    return this.toAdminDetail(product);
  }

  async remove(id: number, actorId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product._count.orderItems > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: { isActive: false },
        });
        await this.audit.record(tx, {
          actorId,
          action: 'PRODUCT_DEACTIVATED',
          entityType: 'PRODUCT',
          entityId: id,
          summary: product.name,
          details:
            'Tiene ventas asociadas: se desactivó en lugar de eliminarse',
        });
      });
      return { deleted: false, deactivated: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id } });
      await this.audit.record(tx, {
        actorId,
        action: 'PRODUCT_DELETED',
        entityType: 'PRODUCT',
        entityId: id,
        summary: product.name,
      });
    });
    return { deleted: true, deactivated: false };
  }

  private async assertCategory(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException('Categoría inexistente');
    }
  }

  private toSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${base}-${Date.now().toString(36)}`;
  }

  private toAdminDetail(product: {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: { toString(): string };
    stock: number;
    isActive: boolean;
    categoryId: number;
    category: { id: number; name: string; slug: string };
    images: { url: string }[];
  }) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock,
      isActive: product.isActive,
      categoryId: product.categoryId,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      images: product.images.map((image) => image.url),
    };
  }
}
