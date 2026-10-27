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
          'inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm',
          hasPrevious ? 'hover:bg-secondary' : 'pointer-events-none opacity-40',
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
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
                'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm',
                value === page
                  ? 'bg-primary text-primary-foreground'
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
          'inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm',
          hasNext ? 'hover:bg-secondary' : 'pointer-events-none opacity-40',
        )}
      >
        Siguiente
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
