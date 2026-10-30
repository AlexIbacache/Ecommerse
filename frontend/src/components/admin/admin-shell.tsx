'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AdminShellSkeleton } from '@/components/loading/skeletons';
import { RequireAdmin } from '@/components/require-auth';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/ventas', label: 'Ventas' },
  { href: '/admin/comentarios', label: 'Comentarios' },
  { href: '/admin/actividad', label: 'Actividad' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  if (status === 'loading') {
    return <AdminShellSkeleton />;
  }

  return (
    <RequireAdmin>
      <div className="container-page py-8 sm:py-12">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Panel administrativo</p>
          <h1 className="text-3xl font-normal tracking-[-0.03em] sm:text-4xl">Administración</h1>
        </div>

        <nav aria-label="Secciones del panel" className="mb-8 mt-6 grid grid-cols-2 gap-1 rounded-2xl border bg-card p-1 [&>a:last-child:nth-child(odd)]:col-span-2 sm:flex sm:overflow-x-auto sm:rounded-full sm:[&>a:last-child:nth-child(odd)]:col-span-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                pathname === link.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </RequireAdmin>
  );
}
