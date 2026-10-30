import { Algorithm, hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  categorySlug: string;
  images: string[];
};

const CATEGORIES = [
  { name: 'Audio', slug: 'audio', description: 'Equipos de sonido y música' },
  {
    name: 'Accesorios',
    slug: 'accesorios',
    description: 'Accesorios para tecnología y uso diario',
  },
  { name: 'Hogar', slug: 'hogar', description: 'Objetos para el hogar y el escritorio' },
];

const PRODUCTS: SeedProduct[] = [
  {
    slug: 'auriculares-inalambricos-pro',
    name: 'Auriculares Inalámbricos Pro',
    description:
      'Auriculares con cancelación activa de ruido, hasta 30 horas de batería y estuche de carga rápida.',
    price: '129.99',
    stock: 25,
    categorySlug: 'audio',
    images: [
      'https://picsum.photos/seed/auriculares-pro-1/800/800',
      'https://picsum.photos/seed/auriculares-pro-2/800/800',
    ],
  },
  {
    slug: 'parlante-bluetooth-portatil',
    name: 'Parlante Bluetooth Portátil',
    description:
      'Parlante resistente al agua con sonido estéreo y 12 horas de reproducción continua.',
    price: '79.50',
    stock: 40,
    categorySlug: 'audio',
    images: ['https://picsum.photos/seed/parlante-portatil/800/800'],
  },
  {
    slug: 'vinilo-edicion-limitada',
    name: 'Vinilo Edición Limitada',
    description:
      'Edición de coleccionista en vinilo de 180 gramos, con arte interior y descarga digital.',
    price: '34.99',
    stock: 2,
    categorySlug: 'audio',
    images: ['https://picsum.photos/seed/vinilo-limitado/800/800'],
  },
  {
    slug: 'funda-protectora-premium',
    name: 'Funda Protectora Premium',
    description:
      'Funda de cuero sintético con interior acolchado y cierre magnético para uso diario.',
    price: '19.99',
    stock: 100,
    categorySlug: 'accesorios',
    images: ['https://picsum.photos/seed/funda-premium/800/800'],
  },
  {
    slug: 'cable-usb-c-trenzado',
    name: 'Cable USB-C Trenzado 2m',
    description:
      'Cable de carga rápida y transferencia de datos, con refuerzo trenzado y conectores reforzados.',
    price: '12.99',
    stock: 0,
    categorySlug: 'accesorios',
    images: ['https://picsum.photos/seed/cable-usbc/800/800'],
  },
  {
    slug: 'mochila-urbana-antirrobo',
    name: 'Mochila Urbana Antirrobo',
    description:
      'Mochila con compartimento acolchado para notebook, bolsillo oculto y cierres antirrobo.',
    price: '89.00',
    stock: 15,
    categorySlug: 'accesorios',
    images: ['https://picsum.photos/seed/mochila-urbana/800/800'],
  },
  {
    slug: 'lampara-escritorio-led',
    name: 'Lámpara de Escritorio LED',
    description:
      'Lámpara con tres temperaturas de luz, brazo articulado y base estable para escritorio.',
    price: '45.00',
    stock: 8,
    categorySlug: 'hogar',
    images: ['https://picsum.photos/seed/lampara-led/800/800'],
  },
  {
    slug: 'difusor-aromas-ceramica',
    name: 'Difusor de Aromas Cerámica',
    description:
      'Difusor de cerámica con acabado artesanal, ideal para ambientes pequeños y oficinas.',
    price: '27.50',
    stock: 3,
    categorySlug: 'hogar',
    images: ['https://picsum.photos/seed/difusor-ceramica/800/800'],
  },
  {
    slug: 'organizador-escritorio',
    name: 'Organizador de Escritorio',
    description:
      'Organizador modular con compartimentos para útiles, documentos y accesorios pequeños.',
    price: '22.00',
    stock: 60,
    categorySlug: 'hogar',
    images: ['https://picsum.photos/seed/organizador-escritorio/800/800'],
  },
  {
    slug: 'teclado-mecanico-compacto',
    name: 'Teclado Mecánico Compacto',
    description:
      'Teclado mecánico de perfil bajo, switches táctiles e iluminación regulable para trabajo diario.',
    price: '149.00',
    stock: 12,
    categorySlug: 'accesorios',
    images: ['https://picsum.photos/seed/teclado-mecanico/800/800'],
  },
  {
    slug: 'auriculares-over-ear-inalambricos',
    name: 'Auriculares Over-Ear Inalámbricos',
    description:
      'Auriculares circumaurales con Bluetooth 5, almohadillas de espuma viscoelástica y hasta 35 horas de batería.',
    price: '89.90',
    stock: 18,
    categorySlug: 'audio',
    images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&h=1200&fit=crop&q=80'],
  },
  {
    slug: 'auriculares-studio-plegables',
    name: 'Auriculares Studio Plegables',
    description:
      'Auriculares de diadema plegables con cable desmontable y graves marcados, pensados para música y videollamadas.',
    price: '59.00',
    stock: 30,
    categorySlug: 'audio',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=1200&fit=crop&q=80'],
  },
  {
    slug: 'parlante-bluetooth-resistente-al-agua',
    name: 'Parlante Bluetooth Resistente al Agua',
    description:
      'Parlante portátil con certificación IPX7, sonido estéreo y 12 horas de reproducción continua.',
    price: '64.00',
    stock: 22,
    categorySlug: 'audio',
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1200&h=1200&fit=crop&q=80'],
  },
  {
    slug: 'mouse-inalambrico-ergonomico',
    name: 'Mouse Inalámbrico Ergonómico',
    description:
      'Mouse inalámbrico de 2.4 GHz con sensor óptico de 1600 DPI y diseño ergonómico para uso prolongado.',
    price: '24.90',
    stock: 50,
    categorySlug: 'accesorios',
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1200&h=1200&fit=crop&q=80'],
  },
  {
    slug: 'teclado-mecanico-75-compacto',
    name: 'Teclado Mecánico 75% Compacto',
    description:
      'Teclado mecánico inalámbrico de 84 teclas con switches intercambiables y retroiluminación configurable.',
    price: '79.00',
    stock: 14,
    categorySlug: 'accesorios',
    images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200&h=1200&fit=crop&q=80'],
  },
  {
    slug: 'teclado-inalambrico-slim',
    name: 'Teclado Inalámbrico Slim',
    description:
      'Teclado de perfil bajo con conexión Bluetooth, batería recargable y distribución en español.',
    price: '39.90',
    stock: 35,
    categorySlug: 'accesorios',
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&h=1200&fit=crop&q=80'],
  },
  {
    slug: 'notebook-ultraliviano-14',
    name: 'Notebook Ultraliviano 14"',
    description:
      'Notebook de 14 pulgadas con pantalla Full HD, 16 GB de RAM y SSD de 512 GB para trabajo y estudio.',
    price: '649.00',
    stock: 6,
    categorySlug: 'accesorios',
    images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1200&h=1200&fit=crop&q=80'],
  },
  {
    slug: 'tablet-11-pulgadas',
    name: 'Tablet 11 Pulgadas',
    description:
      'Tablet de 11 pulgadas con pantalla de alta resolución, 128 GB de almacenamiento y compatibilidad con lápiz.',
    price: '329.00',
    stock: 3,
    categorySlug: 'accesorios',
    images: ['https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=1200&h=1200&fit=crop&q=80'],
  },
  {
    slug: 'procesador-de-8-nucleos',
    name: 'Procesador de 8 Núcleos',
    description:
      'Procesador de escritorio de 8 núcleos y 16 hilos, socket AM4, ideal para equipos de trabajo y juegos.',
    price: '199.00',
    stock: 7,
    categorySlug: 'accesorios',
    images: ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1200&h=1200&fit=crop&q=80'],
  },
];

async function main(): Promise<void> {
  const [clientRole, adminRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'CLIENTE' },
      update: {},
      create: { name: 'CLIENTE' },
    }),
    prisma.role.upsert({
      where: { name: 'ADMINISTRADOR' },
      update: {},
      create: { name: 'ADMINISTRADOR' },
    }),
  ]);

  const [adminPasswordHash, clientPasswordHash] = await Promise.all([
    hash('Admin123!', ARGON2_OPTIONS),
    hash('Cliente123!', ARGON2_OPTIONS),
  ]);

  await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {},
    create: {
      email: 'admin@demo.local',
      name: 'Administrador Demo',
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'cliente@demo.local' },
    update: {},
    create: {
      email: 'cliente@demo.local',
      name: 'Cliente Demo',
      passwordHash: clientPasswordHash,
      roleId: clientRole.id,
    },
  });

  const categoriesBySlug = new Map<string, number>();

  for (const category of CATEGORIES) {
    const stored = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    categoriesBySlug.set(stored.slug, stored.id);
  }

  for (const product of PRODUCTS) {
    const categoryId = categoriesBySlug.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Categoría inexistente en seed: ${product.categorySlug}`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId,
        images: {
          create: product.images.map((url, index) => ({ url, position: index })),
        },
      },
    });
  }

  const [roles, users, categories, products, images] = await Promise.all([
    prisma.role.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.productImage.count(),
  ]);

  console.log(
    `Seed completado: ${roles} roles, ${users} usuarios, ${categories} categorías, ${products} productos, ${images} imágenes.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed falló:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
