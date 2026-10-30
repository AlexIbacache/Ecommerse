import { FadeIn } from '@/components/storefront/fade-in';
import { FeaturedProducts } from '@/components/storefront/featured-products';
import { HeroSlider } from '@/components/storefront/hero-slider';
import { PerksStrip } from '@/components/storefront/perks-strip';
import { RecentlyViewed } from '@/components/storefront/recently-viewed';
import { getProducts } from '@/lib/catalog';

export default async function HomePage() {
  const { data: latest } = await getProducts({ sort: 'createdAt_desc', pageSize: 24 });

  const recent = latest.slice(0, 4);
  const low = latest.filter((product) => product.available && product.stock <= 3).slice(0, 4);
  const hero = latest.filter((product) => product.available && product.image).slice(0, 4);

  return (
    <div className="container-page">
      <HeroSlider products={hero} />

      <PerksStrip />

      <FadeIn>
        <FeaturedProducts recent={recent} low={low} />
      </FadeIn>

      <RecentlyViewed />
    </div>
  );
}
