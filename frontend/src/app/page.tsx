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
      <section className="surface-navy mt-4 grid gap-10 rounded-2xl border border-border/60 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-14">
        <div className="space-y-6">
          <p className="eyebrow">Curaduría · Diseño · Uso diario</p>
          <h1 className="text-4xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            Objetos para vivir mejor.
          </h1>
          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
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

        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary shadow-glow">
          <img
            src="https://picsum.photos/seed/terral-hero/1200/900"
            alt="Selección de objetos Terral"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 rounded-full bg-background/80 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-foreground backdrop-blur">
            Envíos a todo el país
          </div>
        </div>
      </section>

      <section className="pb-6 pt-12">
        <p className="eyebrow">Categorías</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/productos?category=${category.slug}`}
              className="inline-flex h-11 items-center rounded-full border border-input/60 bg-card px-5 text-sm font-medium shadow-sm transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent/10 hover:text-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <FadeIn>
        <section id="destacados" className="space-y-8 py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Destacados</p>
              <h2 className="mt-1 text-3xl font-normal tracking-[-0.025em] sm:text-4xl">Recién llegados</h2>
            </div>
            <Link href="/productos" className="inline-flex h-11 items-center text-sm font-medium text-accent underline-offset-4 hover:underline">
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
