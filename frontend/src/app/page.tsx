import Link from 'next/link';
import { FadeIn } from '@/components/storefront/fade-in';
import { ProductCard } from '@/components/storefront/product-card';
import { Button } from '@/components/ui/button';
import { getCategories, getProducts } from '@/lib/catalog';

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getProducts({ sort: 'createdAt_desc', pageSize: 4 }),
    getCategories(),
  ]);

  return (
    <div className="container-page">
      <section className="grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <p className="eyebrow">Curaduría · Diseño · Uso diario</p>
          <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            Objetos para vivir mejor.
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            Una selección de audio, accesorios y hogar pensada para acompañar
            tus días. Compra simple y pago seguro con PayPal Sandbox.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/productos">Ver catálogo</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#destacados">Destacados</Link>
            </Button>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-secondary">
          <img
            src="https://picsum.photos/seed/terral-hero/1200/900"
            alt="Selección de objetos Terral"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 rounded-md bg-background/90 px-4 py-2 text-sm font-medium backdrop-blur">
            Envíos a todo el país
          </div>
        </div>
      </section>

      <section className="pb-6">
        <p className="eyebrow">Categorías</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/productos?category=${category.slug}`}
              className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-secondary"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <FadeIn>
        <section id="destacados" className="space-y-6 py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Destacados</p>
              <h2 className="text-2xl font-semibold sm:text-3xl">Recién llegados</h2>
            </div>
            <Link href="/productos" className="text-sm font-medium text-primary hover:underline">
              Ver todo →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.data.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
