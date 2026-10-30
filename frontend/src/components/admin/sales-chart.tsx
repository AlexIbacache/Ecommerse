'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminInsightsApi, type DailySales } from '@/lib/admin-insights';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

const RANGES = [7, 30, 90] as const;
const CHART_HEIGHT = 'h-52 sm:h-60';

/** Redondea hacia arriba a 1, 2, 5 o 10 × 10^n para que los ejes tengan valores legibles. */
function niceCeil(value: number): number {
  if (value <= 0) return 10;
  const power = 10 ** Math.floor(Math.log10(value));
  const fraction = value / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

function parseDay(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function formatDay(date: string, long = false): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    ...(long ? { weekday: 'short' } : {}),
  }).format(parseDay(date));
}

/** Índices repartidos de forma pareja entre el primer y el último día. */
function labelIndices(length: number, count: number): number[] {
  const total = Math.min(length, count);
  if (total <= 1) return length > 0 ? [0] : [];
  return Array.from({ length: total }, (_, k) => Math.round((k * (length - 1)) / (total - 1)));
}

function formatAxis(value: number): string {
  return value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : `$${value}`;
}

export function SalesChart() {
  const reduce = useReducedMotion();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<DailySales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setActive(null);
    try {
      setData(await adminInsightsApi.dailySales(days));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const series = data?.series ?? [];
  const values = series.map((point) => Number(point.revenue));
  const max = niceCeil(Math.max(0, ...values));
  const wideLabels = new Set(labelIndices(series.length, 6));
  const narrowLabels = new Set(labelIndices(series.length, 3));
  const labelPositions = [...new Set([...wideLabels, ...narrowLabels])].sort((a, b) => a - b);
  const point = active !== null ? series[active] : null;

  function moveActive(delta: number) {
    if (series.length === 0) return;
    setActive((current) => {
      const base = current ?? (delta > 0 ? -1 : series.length);
      return Math.min(series.length - 1, Math.max(0, base + delta));
    });
  }

  return (
    <section className="rounded-xl border bg-card p-5" aria-labelledby="sales-chart-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="sales-chart-title" className="font-display text-lg font-medium tracking-tight">
            Ingresos por día
          </h2>
          <p className="mt-1 min-h-5 text-sm text-muted-foreground" aria-live="polite">
            {point ? (
              <>
                <span className="font-mono text-xs uppercase tracking-[0.08em]">{formatDay(point.date, true)}</span>
                {' · '}
                <strong className="font-medium text-foreground">{formatPrice(point.revenue)}</strong>
                {' · '}
                {point.orders} {point.orders === 1 ? 'pedido' : 'pedidos'}
              </>
            ) : data ? (
              <>
                Últimos {data.days} días:{' '}
                <strong className="font-medium text-foreground">{formatPrice(data.totals.revenue)}</strong>
                {' · '}
                {data.totals.orders} {data.totals.orders === 1 ? 'pedido pagado' : 'pedidos pagados'}
              </>
            ) : null}
          </p>
        </div>

        <div role="group" aria-label="Período" className="flex rounded-full border bg-background p-0.5">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={days === range}
              onClick={() => setDays(range)}
              className={cn(
                'h-10 min-w-12 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                days === range ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {range} d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {loading && !data ? (
          <Skeleton className={cn('w-full rounded-lg', CHART_HEIGHT)} />
        ) : error ? (
          <div role="alert" className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No pudimos cargar las ventas diarias.</p>
            <Button className="mt-4" onClick={load}>
              Reintentar
            </Button>
          </div>
        ) : data && data.totals.orders === 0 ? (
          <div className={cn('flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground', CHART_HEIGHT)}>
            Sin ventas pagadas en los últimos {data.days} días.
          </div>
        ) : (
          <div
            className={cn('grid grid-cols-[auto_1fr] gap-x-3 transition-opacity duration-200', loading && 'opacity-60')}
            tabIndex={0}
            role="group"
            aria-label="Gráfico de ingresos diarios. Usa las flechas izquierda y derecha para recorrer los días."
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                moveActive(1);
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                moveActive(-1);
              } else if (event.key === 'Escape') {
                setActive(null);
              }
            }}
            onBlur={() => setActive(null)}
          >
            <div aria-hidden="true" className={cn('relative w-10 font-mono text-[11px] text-muted-foreground', CHART_HEIGHT)}>
              {[1, 0.5, 0].map((fraction) => (
                <span
                  key={fraction}
                  className="absolute right-0 -translate-y-1/2 tabular-nums"
                  style={{ top: `${(1 - fraction) * 100}%` }}
                >
                  {formatAxis(max * fraction)}
                </span>
              ))}
            </div>

            <div>
              <div
                className={cn('relative flex items-end gap-px', CHART_HEIGHT)}
                onPointerLeave={() => setActive(null)}
              >
                {[0, 0.5, 1].map((fraction) => (
                  <div
                    key={fraction}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 border-t border-border/70"
                    style={{ top: `${fraction * 100}%` }}
                  />
                ))}

                {series.map((entry, index) => {
                  const value = values[index];
                  const height = value > 0 ? Math.max((value / max) * 100, 1.5) : 0;
                  const isActive = active === index;

                  return (
                    <div
                      key={`${days}-${entry.date}`}
                      className={cn(
                        'relative z-10 flex h-full flex-1 items-end rounded-sm transition-colors duration-150',
                        isActive && 'bg-accent/10',
                      )}
                      onPointerEnter={() => setActive(index)}
                      onPointerDown={() => setActive(index)}
                    >
                      {height > 0 && (
                        <motion.div
                          className={cn(
                            'w-full rounded-t-sm transition-colors duration-150',
                            isActive ? 'bg-accent' : 'bg-accent/60',
                          )}
                          style={{ height: `${height}%`, originY: 1 }}
                          initial={reduce ? false : { scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: 0.35,
                            delay: reduce ? 0 : Math.min(index * 0.01, 0.3),
                            ease: [0.2, 0.7, 0.2, 1],
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div aria-hidden="true" className="relative mt-2 h-4 font-mono text-[11px] text-muted-foreground">
                {labelPositions.map((index) => {
                  const entry = series[index];
                  const left = ((index + 0.5) / series.length) * 100;
                  const edge = index === 0 ? '0%' : index === series.length - 1 ? '-100%' : '-50%';

                  return (
                    <span
                      key={entry.date}
                      className={cn(
                        'absolute top-0 whitespace-nowrap',
                        !narrowLabels.has(index) && 'hidden sm:block',
                        !wideLabels.has(index) && 'sm:hidden',
                      )}
                      style={{ left: `${left}%`, transform: `translateX(${edge})` }}
                    >
                      {formatDay(entry.date)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {data && (
        <table className="sr-only">
          <caption>Ingresos diarios de los últimos {data.days} días</caption>
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col">Ingresos</th>
              <th scope="col">Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {data.series.map((entry) => (
              <tr key={entry.date}>
                <th scope="row">{formatDay(entry.date, true)}</th>
                <td>{formatPrice(entry.revenue)}</td>
                <td>{entry.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
