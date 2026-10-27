import { ProductGridSkeleton } from '@/components/storefront/product-grid-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-6 h-20 w-full rounded-lg" />
      <div className="mt-8">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
