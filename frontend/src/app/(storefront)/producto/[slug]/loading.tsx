import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-4 w-40" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
