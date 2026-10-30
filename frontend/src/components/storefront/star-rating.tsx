'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-6 w-6',
} as const;

function Stars({ size, filled }: { size: keyof typeof SIZES; filled?: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={cn('flex-none', SIZES[size], filled && 'fill-current')} />
      ))}
    </>
  );
}

/** Estrellas de solo lectura; admite decimales (4.5 llena cuatro y media). */
export function StarRating({
  value,
  size = 'md',
  className,
}: {
  value: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));

  return (
    <span
      role="img"
      aria-label={`${clamped.toFixed(1)} de 5 estrellas`}
      className={cn('relative inline-flex flex-none', className)}
    >
      <span aria-hidden="true" className="flex gap-0.5 text-input">
        <Stars size={size} />
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-warning"
        style={{ width: `${(clamped / 5) * 100}%` }}
      >
        <Stars size={size} filled />
      </span>
    </span>
  );
}

/** Selector de 1 a 5 estrellas. Tocar la estrella elegida otra vez quita la puntuación. */
export function StarInput({
  value,
  onChange,
  label = 'Puntuación',
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  function handleKey(event: React.KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      onChange(Math.max(1, (value || 2) - 1));
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex"
      onKeyDown={handleKey}
      onPointerLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
          tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
          onPointerEnter={() => setHover(star)}
          onClick={() => onChange(value === star ? 0 : star)}
          className="flex h-11 w-10 items-center justify-center rounded-md text-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn(
              'h-7 w-7 transition-[transform,color] duration-150 motion-reduce:transition-none',
              star <= shown && 'fill-warning text-warning',
              hover === star && 'scale-110 motion-reduce:scale-100',
            )}
          />
        </button>
      ))}
    </div>
  );
}
