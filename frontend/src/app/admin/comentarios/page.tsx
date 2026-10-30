'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { adminCommentsApi, ApiError, type AdminComment } from '@/lib/api';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[] | null>(null);
  const [meta, setMeta] = useState<{ totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminComment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await adminCommentsApi.list(page, 10);
      setComments(result.data);
      setMeta(result.meta);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleStatus(comment: AdminComment) {
    setBusyId(comment.id);
    try {
      const next = comment.status === 'VISIBLE' ? 'OCULTO' : 'VISIBLE';
      await adminCommentsApi.setStatus(comment.id, next);
      toast.success(
        next === 'OCULTO' ? 'Comentario ocultado' : 'Comentario visible',
      );
      await load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'No pudimos actualizar el comentario',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setBusyId(pendingDelete.id);
    try {
      await adminCommentsApi.remove(pendingDelete.id);
      toast.success('Comentario eliminado');
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'No pudimos eliminar el comentario',
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-normal tracking-[-0.02em]">Comentarios</h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No pudimos cargar los comentarios.
          </p>
          <Button className="mt-4" onClick={load}>
            Reintentar
          </Button>
        </div>
      ) : comments && comments.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No hay comentarios para moderar.
        </div>
      ) : (
        <ul className="animate-fade-up space-y-3 motion-reduce:animate-none">
          {(comments ?? []).map((comment) => (
            <li key={comment.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {comment.authorName}
                    {comment.isAnonymous && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        visitante
                      </span>
                    )}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {comment.product.name} · {formatDate(comment.createdAt)}
                  </p>
                </div>
                <Badge variant={comment.status === 'VISIBLE' ? 'success' : 'outline'}>
                  {comment.status === 'VISIBLE' ? 'Visible' : 'Oculto'}
                </Badge>
              </div>

              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {comment.content}
              </p>

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === comment.id}
                  onClick={() => toggleStatus(comment)}
                >
                  {comment.status === 'VISIBLE' ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Mostrar
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === comment.id}
                  onClick={() => setPendingDelete(comment)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
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

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Eliminar comentario</DialogTitle>
          <DialogDescription>
            ¿Quieres eliminar definitivamente este comentario de{' '}
            {pendingDelete?.authorName}?
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
