'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { RequireAdmin } from '@/components/require-auth';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/ventas', label: 'Ventas' },
  { href: '/admin/comentarios', label: 'Comentarios' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  return (
    <RequireAdmin>
      <div className="container-page py-8 sm:py-12">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Panel administrativo</p>
          <h1 className="text-3xl font-normal tracking-[-0.03em] sm:text-4xl">Administración</h1>
        </div>

        <nav aria-label="Secciones del panel" className="mb-8 mt-6 flex gap-1 overflow-x-auto rounded-full border bg-card p-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
