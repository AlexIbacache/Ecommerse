'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import type { Category } from '@/lib/types';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc', label: 'Nombre A–Z' },
];

export interface CatalogCurrent {
  q?: string;
  category?: string;
  sort?: string;
}

export function CatalogControls({
  categories,
  current,
}: {
  categories: Category[];
  current: CatalogCurrent;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(current.q ?? '');
  const initialized = useRef(false);

  function navigate(next: CatalogCurrent) {
    const merged = {
      q: current.q,
      category: current.category,
      sort: current.sort,
      ...next,
    };

    const params = new URLSearchParams();
    if (merged.q) params.set('q', merged.q);
    if (merged.category) params.set('category', merged.category);
    if (merged.sort && merged.sort !== 'createdAt_desc') {
      params.set('sort', merged.sort);
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const timer = setTimeout(() => {
      const value = search.trim();
      if ((current.q ?? '') !== value) {
        navigate({ q: value || undefined });
      }
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters = Boolean(current.q || current.category || (current.sort && current.sort !== 'createdAt_desc'));

  const selectedCategoryName = current.category
    ? (categories.find((category) => category.slug === current.category)?.name ??
      'Categoría')
    : 'Todas las categorías';

  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === (current.sort ?? 'createdAt_desc'))
      ?.label ?? 'Ordenar';

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar productos…"
          className="pl-9"
          aria-label="Buscar productos"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:flex md:w-auto">
        <Select
          value={current.category ?? 'all'}
          onValueChange={(value) =>
            navigate({ category: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="md:w-44" aria-label="Filtrar por categoría">
            <span className="truncate">{selectedCategoryName}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={current.sort ?? 'createdAt_desc'}
          onValueChange={(value) => navigate({ sort: value })}
        >
          <SelectTrigger className="md:w-56" aria-label="Ordenar resultados">
            <span className="truncate">{selectedSortLabel}</span>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch('');
            navigate({ q: undefined, category: undefined, sort: undefined });
          }}
        >
          <X className="h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
