'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SalesChart } from '@/components/admin/sales-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi, type AdminMetrics } from '@/lib/api';
import { formatPrice } from '@/lib/format';

type BadgeVariant = 'default' | 'accent' | 'outline' | 'muted' | 'success' | 'warning' | 'destructive';

const STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDIENTE_PAGO: { label: 'Pendiente de pago', variant: 'warning' },
  PAGADO: { label: 'Pagado', variant: 'success' },
  PAGO_FALLIDO: { label: 'Pago fallido', variant: 'destructive' },
  CANCELADO: { label: 'Cancelado', variant: 'outline' },
};

const DISTRIBUTION_STATUSES = [
  'PENDIENTE_PAGO',
  'PAGADO',
  'PAGO_FALLIDO',
  'CANCELADO',
] as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-accent/50 hover:shadow-glow motion-reduce:transition-none">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      </div>
      <p className="mt-3 font-display text-4xl font-normal tabular-nums tracking-[-0.03em]">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setMetrics(await adminApi.metrics());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive">
          No pudimos cargar las métricas.
        </p>
        <Button className="mt-4" onClick={load}>
          Reintentar
        </Button>
      </div>
    );
  }

  const distribution = DISTRIBUTION_STATUSES.map((status) => ({
    status,
    count:
      metrics.statusDistribution.find((entry) => entry.status === status)?.count ?? 0,
  }));
  const maxCount = Math.max(1, ...distribution.map((entry) => entry.count));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Package} label="Productos" value={metrics.totalProducts} />
        <MetricCard icon={ShoppingCart} label="Ventas" value={metrics.totalSales} />
        <MetricCard
          icon={DollarSign}
          label="Ingresos"
          value={formatPrice(metrics.revenue)}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Bajo stock"
          value={metrics.lowStock.length}
        />
      </div>

      <SalesChart />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border bg-card">
          <header className="border-b px-5 py-4">
            <h2 className="font-display text-lg font-medium tracking-tight">Pedidos recientes</h2>
          </header>
          <ul className="divide-y">
            {metrics.recentOrders.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">
                Todavía no hay pedidos.
              </li>
            ) : (
              metrics.recentOrders.map((order) => {
                const status = STATUS_META[order.status] ?? {
                  label: order.status,
                  variant: 'outline' as BadgeVariant,
                };

                return (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        #{order.id} · {order.customerName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="font-display font-medium tabular-nums">{formatPrice(order.total)}</span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className="rounded-xl border bg-card">
          <header className="border-b px-5 py-4">
            <h2 className="font-display text-lg font-medium tracking-tight">Bajo stock</h2>
          </header>
          <ul className="divide-y">
            {metrics.lowStock.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">
                Todo con stock suficiente.
              </li>
            ) : (
              metrics.lowStock.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                >
                  <span>{product.name}</span>
                  <Badge variant={product.stock === 0 ? 'destructive' : 'warning'}>
                    {product.stock} u.
                  </Badge>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-display text-lg font-medium tracking-tight">Distribución de pedidos por estado</h2>
        <div className="mt-4 space-y-3">
          {distribution.map((entry) => (
            <div key={entry.status}>
              <div className="flex items-center justify-between text-sm">
                <span>{STATUS_META[entry.status]?.label ?? entry.status}</span>
                <span className="font-mono text-muted-foreground">{entry.count}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
                  style={{ width: `${(entry.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
