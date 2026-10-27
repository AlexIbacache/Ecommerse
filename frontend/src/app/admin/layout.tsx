'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <RequireAdmin>
      <div className="container-page py-8">
        <div className="flex flex-col gap-1">
          <p className="eyebrow">Panel administrativo</p>
          <h1 className="text-2xl font-semibold">Administración</h1>
        </div>

        <nav className="mb-8 mt-5 flex gap-1 overflow-x-auto rounded-lg border bg-card p-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors',
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
