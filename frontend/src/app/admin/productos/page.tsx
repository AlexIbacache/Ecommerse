'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  adminProductsApi,
  ApiError,
  categoriesApi,
  type AdminProduct,
} from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { adminProductFormSchema } from '@/lib/schemas';
import type { Category } from '@/lib/types';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Más recientes' },
  { value: 'name_asc', label: 'Nombre A–Z' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'stock_asc', label: 'Stock: menor a mayor' },
];

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  stock: '0',
  isActive: true,
  imagesText: '',
};

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [meta, setMeta] = useState<{ totalPages: number; totalItems: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await adminProductsApi.list({
        q: q || undefined,
        category: category || undefined,
        sort,
        page,
      });
      setProducts(result.data);
      setMeta(result.meta);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [q, category, sort, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0] ? String(categories[0].id) : '',
    });
    setFormErrors({});
    setFormOpen(true);
  }

  async function openEdit(product: AdminProduct) {
    setEditingId(product.id);
    setFormErrors({});
    setFormOpen(true);
    setLoadingDetail(true);
    try {
      const detail = await adminProductsApi.get(product.id);
      setForm({
        name: detail.name,
        description: detail.description,
        price: detail.price,
        categoryId: String(detail.categoryId),
        stock: String(detail.stock),
        isActive: detail.isActive,
        imagesText: detail.images.join('\n'),
      });
    } catch {
      toast.error('No pudimos cargar el producto');
      setFormOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setFormErrors({});

    const images = form.imagesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed = adminProductFormSchema.safeParse({
      name: form.name,
      description: form.description,
      price: form.price,
      categoryId: form.categoryId,
      stock: form.stock,
      isActive: form.isActive,
      images,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFormErrors(errors);
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await adminProductsApi.update(editingId, parsed.data);
        toast.success('Producto actualizado');
      } else {
        await adminProductsApi.create(parsed.data);
        toast.success('Producto creado');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.errors?.length) {
        const errors: Record<string, string> = {};
        for (const fieldError of err.errors) {
          errors[fieldError.field] = fieldError.message;
        }
        setFormErrors(errors);
        toast.error('Revisa los datos del producto');
      } else {
        toast.error(
          err instanceof ApiError ? err.message : 'No pudimos guardar el producto',
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      const result = await adminProductsApi.remove(deleteTarget.id);
      if (result.deactivated) {
        toast.success('Producto desactivado (tiene ventas asociadas)');
      } else {
        toast.success('Producto eliminado');
      }
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'No pudimos eliminar el producto',
      );
    } finally {
      setDeleting(false);
    }
  }

  const selectedCategoryName = category
    ? (categories.find((item) => item.slug === category)?.name ?? 'Categoría')
    : 'Todas las categorías';
  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Ordenar';
  const formCategoryName = form.categoryId
    ? (categories.find((item) => String(item.id) === form.categoryId)?.name ??
      'Categoría')
    : 'Categoría';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-normal tracking-[-0.02em]">Productos</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre…"
          className="md:max-w-xs"
          aria-label="Buscar productos"
        />

        <Select
          value={category || 'all'}
          onValueChange={(value) => {
            setCategory(value === 'all' ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="md:w-48" aria-label="Filtrar por categoría">
            <span className="truncate">{selectedCategoryName}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item.id} value={item.slug}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="md:w-56" aria-label="Ordenar productos">
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

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No pudimos cargar los productos.
          </p>
          <Button className="mt-4" onClick={load}>
            Reintentar
          </Button>
        </div>
      ) : products && products.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay productos que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="block w-full text-sm md:table md:min-w-[640px]">
            <thead className="hidden bg-secondary text-left md:table-header-group font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="block divide-y md:table-row-group">
              {(products ?? []).map((product) => (
                <tr key={product.id} className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:table-row md:p-0">
                  <td className="col-span-2 md:table-cell md:px-4 md:py-3">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.category.name}
                    </p>
                  </td>
                  <td data-label="Precio" className="md:table-cell md:px-4 md:py-3 font-display font-medium tabular-nums before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden">{formatPrice(product.price)}</td>
                  <td data-label="Stock" className="md:table-cell md:px-4 md:py-3 font-mono tabular-nums before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden">{product.stock}</td>
                  <td data-label="Estado" className="md:table-cell md:px-4 md:py-3 before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden">
                    <Badge
                      variant={
                        !product.isActive
                          ? 'outline'
                          : product.stock === 0
                            ? 'destructive'
                            : 'success'
                      }
                    >
                      {!product.isActive
                        ? 'Inactivo'
                        : product.stock === 0
                          ? 'Sin stock'
                          : 'Disponible'}
                    </Badge>
                  </td>
                  <td className="col-span-2 md:table-cell md:px-4 md:py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${product.name}`}
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${product.name}`}
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>
            {editingId ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
          <DialogDescription>
            Los campos se validan en el cliente y en el backend.
          </DialogDescription>

          {loadingDetail ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <form className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1" onSubmit={submitForm}>
              <div className="space-y-1">
                <label htmlFor="p-name" className="text-sm font-medium">
                  Nombre
                </label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="p-description" className="text-sm font-medium">
                  Descripción
                </label>
                <textarea
                  id="p-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-base transition-[border-color,box-shadow] duration-200 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm"
                />
                {formErrors.description && (
                  <p className="text-xs text-destructive">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="p-price" className="text-sm font-medium">
                    Precio (USD)
                  </label>
                  <Input
                    id="p-price"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, price: event.target.value }))
                    }
                  />
                  {formErrors.price && (
                    <p className="text-xs text-destructive">{formErrors.price}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="p-stock" className="text-sm font-medium">
                    Stock
                  </label>
                  <Input
                    id="p-stock"
                    inputMode="numeric"
                    value={form.stock}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, stock: event.target.value }))
                    }
                  />
                  {formErrors.stock && (
                    <p className="text-xs text-destructive">{formErrors.stock}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium">Categoría</span>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, categoryId: value }))
                  }
                >
                  <SelectTrigger>
                    <span className="truncate">{formCategoryName}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.categoryId && (
                  <p className="text-xs text-destructive">{formErrors.categoryId}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="p-images" className="text-sm font-medium">
                  Imágenes (una URL por línea)
                </label>
                <textarea
                  id="p-images"
                  rows={3}
                  value={form.imagesText}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      imagesText: event.target.value,
                    }))
                  }
                  placeholder="https://ejemplo.com/imagen-producto.jpg"
                  className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-base transition-[border-color,box-shadow] duration-200 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm font-mono"
                />
                {formErrors.images && (
                  <p className="text-xs text-destructive">{formErrors.images}</p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-input"
                />
                Producto activo (visible en la tienda)
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Eliminar producto</DialogTitle>
          <DialogDescription>
            ¿Quieres eliminar “{deleteTarget?.name}”? Si tiene ventas asociadas se
            desactivará en lugar de borrarse para conservar el historial.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
