import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartPanel } from '@/components/storefront/add-to-cart-panel';
import { CommentsSection } from '@/components/storefront/comments-section';
import { FadeIn } from '@/components/storefront/fade-in';
import { ProductGallery } from '@/components/storefront/product-gallery';
import { TrackView } from '@/components/storefront/recently-viewed';
import { StarRating } from '@/components/storefront/star-rating';
import { Badge } from '@/components/ui/badge';
import { getProductOrNull } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductOrNull(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <TrackView
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images[0]?.url ?? null,
        }}
      />
      <nav aria-label="Migas de pan" className="mb-4 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
        <Link href="/productos" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">
          Catálogo
        </Link>
        <span> / </span>
        <span>{product.category.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <FadeIn>
          <ProductGallery images={product.images} name={product.name} />
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="space-y-6 lg:pt-2">
            <div className="space-y-2">
              <p className="eyebrow">{product.category.name}</p>
              <h1 className="text-3xl font-normal leading-[1.1] tracking-[-0.03em] sm:text-4xl lg:text-5xl">{product.name}</h1>
              {product.rating && product.rating.count > 0 && product.rating.average !== null && (
                <a
                  href="#opiniones"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <StarRating value={product.rating.average} />
                  <span>
                    <strong className="font-medium text-foreground">{product.rating.average.toFixed(1)}</strong> ·{' '}
                    {product.rating.count} {product.rating.count === 1 ? 'opinión' : 'opiniones'}
                  </span>
                </a>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-display text-3xl font-medium tabular-nums tracking-[-0.02em]">{formatPrice(product.price)}</p>
                {product.available ? (
                  <Badge variant="success">Disponible</Badge>
                ) : (
                  <Badge variant="outline">Agotado</Badge>
                )}
              </div>
            </div>

            <p className="leading-relaxed text-muted-foreground">{product.description}</p>

            <AddToCartPanel product={product} />

            <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
              <p className="eyebrow">Envío y garantía</p>
              <p className="mt-2">
                Envío en 3–5 días hábiles. Devoluciones dentro de 30 días.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>

      <CommentsSection productId={product.id} />
    </div>
  );
}
