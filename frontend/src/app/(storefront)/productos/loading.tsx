import { ProductGridSkeleton } from '@/components/storefront/product-grid-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="lg:flex">
      <div className="hidden w-72 flex-none border-r bg-card lg:block" />
      <div className="min-w-0 flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-3 h-9 w-72" />
          <Skeleton className="mt-6 h-[68px] w-full rounded-xl" />
          <div className="mt-6">
            <ProductGridSkeleton count={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
