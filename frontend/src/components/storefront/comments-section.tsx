'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StarInput, StarRating } from '@/components/storefront/star-rating';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';
import { reviewsApi, type RatingBreakdown, type ReviewItem } from '@/lib/reviews';
import { commentSchema } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth-store';

const PAGE_SIZE = 5;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

function RatingSummaryCard({ summary }: { summary: RatingBreakdown }) {
  if (summary.count === 0 || summary.average === null) return null;

  return (
    <div className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-6">
      <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
        <p className="font-display text-5xl font-normal tabular-nums tracking-[-0.03em]">
          {summary.average.toFixed(1)}
        </p>
        <div className="space-y-1">
          <StarRating value={summary.average} size="lg" />
          <p className="text-sm text-muted-foreground">
            {summary.count} {summary.count === 1 ? 'puntuación' : 'puntuaciones'}
          </p>
        </div>
      </div>

      <ul className="space-y-1.5" aria-label="Distribución de puntuaciones">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.distribution[star - 1] ?? 0;
          const percent = summary.count > 0 ? (count / summary.count) * 100 : 0;

          return (
            <li key={star} className="flex items-center gap-3 text-sm">
              <span className="w-10 flex-none font-mono text-xs text-muted-foreground">{star} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <span
                  className="block h-full rounded-full bg-warning transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="w-6 flex-none text-right font-mono text-xs tabular-nums text-muted-foreground">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CommentsSection({ productId }: { productId: number }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = status === 'authenticated' && !!user;

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<RatingBreakdown | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [rating, setRating] = useState(0);
  const [website, setWebsite] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(false);

      try {
        const result = await reviewsApi.list(productId, targetPage, PAGE_SIZE);
        setItems(result.data);
        setSummary(result.summary);
        setTotalPages(result.meta.totalPages);
        setTotalItems(result.meta.totalItems);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    void load(page);
  }, [load, page]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);

    const parsed = commentSchema.safeParse({ content, guestName: guestName || undefined });

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    if (!isAuthenticated && (parsed.data.guestName ?? '').length < 2) {
      setFieldError('Indica tu nombre (mínimo 2 caracteres)');
      return;
    }

    setSubmitting(true);

    try {
      await reviewsApi.create(productId, {
        content: parsed.data.content,
        website,
        ...(isAuthenticated ? {} : { guestName: parsed.data.guestName }),
        ...(isAuthenticated && rating > 0 ? { rating } : {}),
      });

      toast.success(rating > 0 ? 'Gracias por tu opinión y tu puntuación' : 'Comentario publicado');
      setContent('');
      setGuestName('');
      setRating(0);

      if (page === 1) {
        await load(1);
      } else {
        setPage(1);
      }

      // La puntuación promedio del encabezado viene del servidor: se vuelve a pedir.
      if (rating > 0) router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error('Demasiados comentarios en poco tiempo. Espera un momento.');
      } else if (err instanceof ApiError && err.status === 409) {
        setFieldError(err.message);
      } else if (err instanceof ApiError && err.errors?.[0]) {
        setFieldError(err.errors[0].message);
      } else {
        toast.error(
          err instanceof ApiError ? err.message : 'No pudimos publicar el comentario',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="opiniones" className="mt-16 scroll-mt-24 border-t pt-10">
      <p className="eyebrow">Opiniones</p>
      <h2 className="mt-1 text-2xl font-normal tracking-[-0.02em] sm:text-3xl">
        Opiniones de clientes {totalItems > 0 ? `(${totalItems})` : ''}
      </h2>

      {summary && summary.count > 0 && (
        <div className="mt-6">
          <RatingSummaryCard summary={summary} />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border bg-card p-4">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No pudimos cargar los comentarios.
            </p>
            <Button variant="outline" className="mt-3" onClick={() => load(page)}>
              Reintentar
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Todavía no hay comentarios. Sé el primero en opinar.
            </p>
          </div>
        ) : (
          <ul className={`space-y-3 transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
            {items.map((comment) => (
              <li key={comment.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold">
                    {comment.authorName}
                    {comment.isAnonymous && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        visitante
                      </span>
                    )}
                  </p>
                  <time className="font-mono text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </time>
                </div>
                {comment.rating !== null && <StarRating value={comment.rating} size="sm" className="mt-1.5" />}
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {comment.content}
                </p>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      <form className="relative mt-8 space-y-3 rounded-xl border bg-card p-5 shadow-sm sm:p-6" onSubmit={submit}>
        <h3 className="font-display text-lg font-medium tracking-tight">Deja tu opinión</h3>

        {isAuthenticated ? (
          <>
            <p className="text-sm text-muted-foreground">
              Opinas como <span className="font-medium text-foreground">{user?.name}</span>
            </p>
            <div>
              <p className="text-sm font-medium">Tu puntuación (opcional)</p>
              <StarInput value={rating} onChange={setRating} />
            </div>
          </>
        ) : (
          <>
            <input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              placeholder="Tu nombre (visible públicamente)"
              aria-label="Tu nombre"
              className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-base transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm sm:max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Para puntuar el producto,{' '}
              <Link href="/login" className="font-medium text-accent underline-offset-4 hover:underline">
                inicia sesión
              </Link>
              .
            </p>
          </>
        )}

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Cuéntanos tu experiencia con este producto…"
          aria-label="Comentario"
          rows={4}
          className="py-2.5 w-full rounded-md border border-input bg-card px-3.5 text-base transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm"
        />

        {/* Campo trampa: fuera de pantalla y fuera del orden de tabulación; las personas no lo ven. */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        {fieldError && (
          <p role="alert" className="text-sm text-destructive">
            {fieldError}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Se publica como texto plano. Máximo 1 enlace por comentario.
          </p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Publicando…' : 'Publicar opinión'}
          </Button>
        </div>
      </form>
    </section>
  );
}
