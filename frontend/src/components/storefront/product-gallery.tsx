'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ProductGallery({
  images,
  name,
}: {
  images: { id: number; url: string; position: number }[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border bg-secondary text-sm text-muted-foreground">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-xl border bg-secondary shadow-sm">
        <img
          src={images[active].url}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver imagen ${index + 1}`}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-[border-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                index === active ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
