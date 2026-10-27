'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { RequireAuth } from '@/components/require-auth';
import {
  ApiError,
  ordersApi,
  usersApi,
  type OrderSummary,
} from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { profileSchema } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth-store';

type BadgeVariant = 'default' | 'accent' | 'outline' | 'muted';

const ORDER_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDIENTE_PAGO: { label: 'Pendiente de pago', variant: 'muted' },
  PAGADO: { label: 'Pagado', variant: 'default' },
  PAGO_FALLIDO: { label: 'Pago fallido', variant: 'accent' },
  CANCELADO: { label: 'Cancelado', variant: 'outline' },
};

const PAYMENT_STATUS: Record<string, string> = {
  CREADA: 'Iniciado',
  COMPLETADA: 'Completado',
  FALLIDA: 'Fallido',
  CANCELADA: 'Cancelado',
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

function AccountContent() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [ordersError, setOrdersError] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const profile = await usersApi.me();
        if (active) {
          setUser(profile);
          setName(profile.name);
          setEmail(profile.email);
        }
      } catch {
        // el guard de sesión ya maneja el caso no autenticado
      }
    })();

    (async () => {
      try {
        const list = await ordersApi.list();
        if (active) {
          setOrders(list);
        }
      } catch {
        if (active) {
          setOrdersError(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [setUser]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = profileSchema.safeParse({ name, email });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setSaving(true);

    try {
      const updated = await usersApi.update(parsed.data);
      setUser(updated);
      setName(updated.name);
      setEmail(updated.email);
      toast.success('Perfil actualizado');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFieldErrors({ email: 'Ese email ya está registrado' });
      } else {
        toast.error(
          error instanceof ApiError ? error.message : 'No pudimos guardar los cambios',
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-semibold">Mi cuenta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestioná tus datos y consultá tus compras.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.25fr]">
        <section className="h-fit rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Datos de la cuenta</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rol: {user?.role === 'ADMINISTRADOR' ? 'Administrador' : 'Cliente'}
          </p>

          <form className="mt-5 space-y-4" onSubmit={save} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Nombre
              </label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
              {fieldErrors.name && (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Historial de compras</h2>

          <div className="mt-4 space-y-3">
            {orders === null && !ordersError ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-lg" />
              ))
            ) : ordersError ? (
              <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                No pudimos cargar tus compras. Recargá la página para reintentar.
              </div>
            ) : (orders ?? []).length === 0 ? (
              <div className="rounded-lg border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Todavía no realizaste compras.
                </p>
                <Button asChild className="mt-3">
                  <Link href="/productos">Ver catálogo</Link>
                </Button>
              </div>
            ) : (
              (orders ?? []).map((order) => {
                const status = ORDER_STATUS[order.status] ?? {
                  label: order.status,
                  variant: 'outline' as BadgeVariant,
                };

                return (
                  <Link
                    key={order.id}
                    href={`/cuenta/pedidos/${order.id}`}
                    className="block rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">Pedido #{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)} · {order.itemCount} ítem(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <span className="text-sm font-semibold">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                    {order.paymentStatus && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Pago: {PAYMENT_STATUS[order.paymentStatus] ?? order.paymentStatus}
                      </p>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CuentaPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}
