import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}

function pageNumbers(page: number, totalPages: number): number[] {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  return [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
}

export function Pagination({ page, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = pageNumbers(page, totalPages);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1">
      <Link
        href={hrefForPage(page - 1)}
        aria-disabled={!hasPrevious}
        className={cn(
          'inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-sm transition-colors sm:px-4',
          hasPrevious ? 'hover:bg-secondary' : 'pointer-events-none opacity-40',
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Anterior</span>
      </Link>

      {pages.map((value, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && value - previous > 1;

        return (
          <span key={value} className="flex items-center gap-1">
            {gap && <span className="px-1 text-muted-foreground">…</span>}
            <Link
              href={hrefForPage(value)}
              aria-current={value === page ? 'page' : undefined}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-full font-mono text-sm transition-colors',
                value === page
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-secondary',
              )}
            >
              {value}
            </Link>
          </span>
        );
      })}

      <Link
        href={hrefForPage(page + 1)}
        aria-disabled={!hasNext}
        className={cn(
          'inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-sm transition-colors sm:px-4',
          hasNext ? 'hover:bg-secondary' : 'pointer-events-none opacity-40',
        )}
      >
        <span className="sr-only sm:not-sr-only">Siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
