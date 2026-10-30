'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { buildHref, type CatalogParams } from '@/components/storefront/catalog-query';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc', label: 'Nombre A–Z' },
];

/** Barra de búsqueda, orden y vista. `children` recibe el botón de filtros móvil. */
export function CatalogControls({
  params,
  children,
}: {
  params: CatalogParams;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(params.q ?? '');

  // La URL cambia al buscar, quitar el chip o "Limpiar": el campo siempre refleja la búsqueda activa.
  useEffect(() => setSearch(params.q ?? ''), [params.q]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = search.trim();
    if ((params.q ?? '') !== value) {
      router.push(buildHref(params, { q: value || undefined }), { scroll: false });
    }
  }

  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === params.sort)?.label ?? 'Ordenar';

  const viewClass = (active: boolean) =>
    `flex h-10 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active ? 'bg-accent text-accent-foreground' : 'text-foreground/80 hover:bg-secondary'
    }`;

  return (
    <div className="dark flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 text-foreground shadow-lg">
      <form role="search" onSubmit={handleSubmit} className="relative min-w-0 flex-1 basis-56">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre y presionar Enter…"
          className="rounded-full pl-10"
          aria-label="Buscar productos"
          type="search"
          enterKeyHint="search"
        />
      </form>

      {children}

      <Select
        value={params.sort}
        onValueChange={(value) => router.push(buildHref(params, { sort: value }), { scroll: false })}
      >
        <SelectTrigger className="w-auto min-w-44 rounded-full" aria-label="Ordenar resultados">
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

      <div role="group" aria-label="Tipo de vista" className="hidden rounded-full border border-input bg-background p-[3px] sm:flex">
        <Link
          href={buildHref(params, { view: 'grid', page: params.page })}
          scroll={false}
          aria-label="Vista cuadrícula"
          aria-current={params.view === 'grid' ? 'true' : undefined}
          className={viewClass(params.view === 'grid')}
        >
          <LayoutGrid className="h-[18px] w-[18px]" />
        </Link>
        <Link
          href={buildHref(params, { view: 'list', page: params.page })}
          scroll={false}
          aria-label="Vista lista"
          aria-current={params.view === 'list' ? 'true' : undefined}
          className={viewClass(params.view === 'list')}
        >
          <List className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </div>
  );
}
