'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, commentsApi, type CommentItem } from '@/lib/api';
import { commentSchema } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth-store';

const PAGE_SIZE = 5;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

export function CommentsSection({ productId }: { productId: number }) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CommentItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(false);

      try {
        const result = await commentsApi.list(productId, targetPage, PAGE_SIZE);
        setItems(result.data);
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

    const isAuthenticated = status === 'authenticated' && user;
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
      await commentsApi.create(productId, {
        content: parsed.data.content,
        ...(isAuthenticated ? {} : { guestName: parsed.data.guestName }),
      });

      toast.success('Comentario publicado');
      setContent('');
      setGuestName('');

      if (page === 1) {
        await load(1);
      } else {
        setPage(1);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error('Demasiados comentarios en poco tiempo. Espera un momento.');
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
    <section className="mt-16 border-t pt-10">
      <p className="eyebrow">Opiniones</p>
      <h2 className="mt-1 text-2xl font-normal tracking-[-0.02em] sm:text-3xl">
        Comentarios {totalItems > 0 ? `(${totalItems})` : ''}
      </h2>

      <div className="mt-6 space-y-4">
        {loading ? (
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
          <ul className="space-y-3">
            {items.map((comment) => (
              <li key={comment.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
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

      <form className="mt-8 space-y-3 rounded-xl border bg-card p-5 shadow-sm sm:p-6" onSubmit={submit}>
        <h3 className="font-display text-lg font-medium tracking-tight">Deja tu comentario</h3>

        {status === 'authenticated' && user ? (
          <p className="text-sm text-muted-foreground">
            Comentás como <span className="font-medium text-foreground">{user.name}</span>
          </p>
        ) : (
          <input
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Tu nombre (visible públicamente)"
            aria-label="Tu nombre"
            className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-base transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm sm:max-w-xs"
          />
        )}

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Cuéntanos tu experiencia con este producto…"
          aria-label="Comentario"
          rows={4}
          className="py-2.5 w-full rounded-md border border-input bg-card px-3.5 text-base transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm"
        />

        {fieldError && (
          <p role="alert" className="text-sm text-destructive">
            {fieldError}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Los comentarios se publican como texto plano.
          </p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Publicando…' : 'Publicar comentario'}
          </Button>
        </div>
      </form>
    </section>
  );
}
