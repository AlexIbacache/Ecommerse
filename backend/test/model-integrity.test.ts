import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const runId = `it${Date.now()}`;

let roleId: number;
let baseCategoryId: number;

async function createUser(label: string) {
  return prisma.user.create({
    data: {
      email: `${runId}-${label}@test.local`,
      name: `Test ${label}`,
      passwordHash: 'placeholder-hash',
      roleId,
    },
  });
}

async function createCategory(label: string) {
  return prisma.category.create({
    data: { name: `${runId} ${label}`, slug: `${runId}-${label}` },
  });
}

async function createProduct(
  label: string,
  overrides: Partial<{ price: string; stock: number; categoryId: number }> = {},
) {
  return prisma.product.create({
    data: {
      name: `${runId} ${label}`,
      slug: `${runId}-${label}`,
      description: 'Producto de prueba',
      price: overrides.price ?? '10.00',
      stock: overrides.stock ?? 5,
      categoryId: overrides.categoryId ?? baseCategoryId,
    },
  });
}

beforeAll(async () => {
  const role = await prisma.role.upsert({
    where: { name: 'CLIENTE' },
    update: {},
    create: { name: 'CLIENTE' },
  });
  roleId = role.id;

  const category = await createCategory('base');
  baseCategoryId = category.id;
});

afterAll(async () => {
  await prisma.payment.deleteMany({
    where: { order: { user: { email: { startsWith: runId } } } },
  });
  await prisma.order.deleteMany({
    where: { user: { email: { startsWith: runId } } },
  });
  await prisma.product.deleteMany({ where: { slug: { startsWith: runId } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: runId } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: runId } } });
  await prisma.$disconnect();
});

describe('integridad del modelo', () => {
  it('rechaza un email duplicado', async () => {
    const email = `${runId}-dup@test.local`;

    await prisma.user.create({
      data: { email, name: 'Primero', passwordHash: 'x', roleId },
    });

    await expect(
      prisma.user.create({
        data: { email, name: 'Segundo', passwordHash: 'y', roleId },
      }),
    ).rejects.toThrow();
  });

  it('rechaza stock negativo', async () => {
    await expect(
      prisma.product.create({
        data: {
          name: 'Stock inválido',
          slug: `${runId}-stock-neg`,
          description: 'x',
          price: '10.00',
          stock: -1,
          categoryId: baseCategoryId,
        },
      }),
    ).rejects.toThrow();
  });

  it('rechaza precio cero o negativo', async () => {
    await expect(
      prisma.product.create({
        data: {
          name: 'Precio inválido',
          slug: `${runId}-price-cero`,
          description: 'x',
          price: '0.00',
          stock: 1,
          categoryId: baseCategoryId,
        },
      }),
    ).rejects.toThrow();
  });

  it('rechaza un paypal_order_id duplicado', async () => {
    const user = await createUser('paypal');
    const product = await createProduct('paypal-prod');
    const paypalOrderId = `${runId}-PYPL-1`;

    const order1 = await prisma.order.create({
      data: {
        userId: user.id,
        total: '10.00',
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: '10.00' }],
        },
      },
    });
    const order2 = await prisma.order.create({
      data: {
        userId: user.id,
        total: '10.00',
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: '10.00' }],
        },
      },
    });

    await prisma.payment.create({
      data: { orderId: order1.id, amount: '10.00', paypalOrderId },
    });

    await expect(
      prisma.payment.create({
        data: { orderId: order2.id, amount: '10.00', paypalOrderId },
      }),
    ).rejects.toThrow();
  });

  it('no permite eliminar una categoría con productos', async () => {
    const category = await createCategory('con-productos');
    await createProduct('en-categoria', { categoryId: category.id });

    await expect(
      prisma.category.delete({ where: { id: category.id } }),
    ).rejects.toThrow();
  });
});

describe('precisión monetaria y snapshot de precios', () => {
  it('almacena y recupera importes exactos', async () => {
    const product1999 = await createProduct('precio-1999', { price: '19.99' });
    const product001 = await createProduct('precio-001', { price: '0.01' });

    const stored1999 = await prisma.product.findUniqueOrThrow({
      where: { id: product1999.id },
    });
    const stored001 = await prisma.product.findUniqueOrThrow({
      where: { id: product001.id },
    });

    expect(stored1999.price.toString()).toBe('19.99');
    expect(stored001.price.toString()).toBe('0.01');
  });

  it('conserva el precio del ítem aunque cambie el precio del producto', async () => {
    const user = await createUser('snapshot');
    const product = await createProduct('snapshot-prod', { price: '19.99' });

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total: '19.99',
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: '19.99' }],
        },
      },
      include: { items: true },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { price: '29.99' },
    });

    const item = await prisma.orderItem.findFirstOrThrow({
      where: { orderId: order.id },
    });

    expect(item.unitPrice.toString()).toBe('19.99');
  });
});
