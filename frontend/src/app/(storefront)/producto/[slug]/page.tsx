import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartPanel } from '@/components/storefront/add-to-cart-panel';
import { CommentsSection } from '@/components/storefront/comments-section';
import { FadeIn } from '@/components/storefront/fade-in';
import { ProductGallery } from '@/components/storefront/product-gallery';
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
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/productos" className="hover:text-foreground">
          Catálogo
        </Link>
        <span> / </span>
        <span>{product.category.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <FadeIn>
          <ProductGallery images={product.images} name={product.name} />
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="eyebrow">{product.category.name}</p>
              <h1 className="text-3xl font-semibold sm:text-4xl">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
                {product.available ? (
                  <Badge variant="muted">Disponible</Badge>
                ) : (
                  <Badge variant="outline">Agotado</Badge>
                )}
              </div>
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            <AddToCartPanel product={product} />

            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Envío y garantía</p>
              <p className="mt-1">
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
