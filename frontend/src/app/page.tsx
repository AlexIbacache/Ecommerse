import { MousePointerClick, ShieldCheck, Truck } from 'lucide-react';
import { FadeIn } from '@/components/storefront/fade-in';
import { FeaturedProducts } from '@/components/storefront/featured-products';
import { HeroSlider } from '@/components/storefront/hero-slider';
import { RecentlyViewed } from '@/components/storefront/recently-viewed';
import { getProducts } from '@/lib/catalog';

const PERKS = [
  { icon: Truck, title: 'Envíos a todo el país', text: 'Recibe tu pedido donde estés.' },
  { icon: ShieldCheck, title: 'Pago seguro con PayPal', text: 'Entorno de prueba, sin dinero real.' },
  { icon: MousePointerClick, title: 'Compra en pocos pasos', text: 'Carrito, checkout y listo.' },
];

export default async function HomePage() {
  const { data: latest } = await getProducts({ sort: 'createdAt_desc', pageSize: 24 });

  const recent = latest.slice(0, 4);
  const low = latest.filter((product) => product.available && product.stock <= 3).slice(0, 4);
  const hero = latest.filter((product) => product.available && product.image).slice(0, 4);

  return (
    <div className="container-page">
      <HeroSlider products={hero} />

      <FadeIn>
        <section aria-label="Ventajas" className="mt-5 grid gap-3 sm:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent motion-reduce:transform-none"
            >
              <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-base font-medium">{title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{text}</span>
              </span>
            </div>
          ))}
        </section>
      </FadeIn>

      <FadeIn>
        <FeaturedProducts recent={recent} low={low} />
      </FadeIn>

      <RecentlyViewed />
    </div>
  );
}
