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
      <div className="flex aspect-square items-center justify-center rounded-lg border bg-secondary text-sm text-muted-foreground">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-lg border bg-secondary">
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
                'h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                index === active ? 'border-primary' : 'border-transparent hover:border-border',
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
