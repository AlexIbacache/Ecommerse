import Link from 'next/link';
import { ArrowUp, ShieldCheck, Truck } from 'lucide-react';
import { getCategories } from '@/lib/catalog';
import type { Category } from '@/lib/types';

const linkClass =
  'block w-fit rounded-sm py-2.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export async function Footer() {
  const categories: Category[] = await getCategories().catch(() => []);

  return (
    <footer className="surface-navy mt-20">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-glow/60 to-transparent"
      />

      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 space-y-4 sm:col-span-3 lg:col-span-1">
          <p className="flex items-center gap-2 font-display text-xl font-medium tracking-[-0.03em]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-glow" />
            store
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Productos elegidos para tu día a día: tecnología, audio, accesorios y hogar.
          </p>
          <ul className="space-y-2 pt-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 flex-none text-accent" aria-hidden="true" />
              Envíos a todo el país
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 flex-none text-accent" aria-hidden="true" />
              Pago seguro con PayPal
            </li>
          </ul>
        </div>

        <nav aria-label="Tienda" className="space-y-1 text-sm">
          <p className="eyebrow pb-2">Tienda</p>
          <Link href="/productos" className={linkClass}>
            Todo el catálogo
          </Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/productos?category=${category.slug}`} className={linkClass}>
              {category.name}
            </Link>
          ))}
        </nav>

        <nav aria-label="Mi cuenta" className="space-y-1 text-sm">
          <p className="eyebrow pb-2">Mi cuenta</p>
          <Link href="/cuenta" className={linkClass}>
            Perfil y pedidos
          </Link>
          <Link href="/carrito" className={linkClass}>
            Carrito
          </Link>
          <Link href="/login" className={linkClass}>
            Ingresar
          </Link>
          <Link href="/registro" className={linkClass}>
            Crear cuenta
          </Link>
        </nav>

        <div className="col-span-2 space-y-2 text-sm text-muted-foreground sm:col-span-1">
          <p className="eyebrow pb-2">Pagos</p>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 font-mono text-xs text-foreground">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan-glow" />
            PayPal Sandbox
          </p>
          <p>Entorno de prueba: no se realizan transacciones con dinero real.</p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 font-mono text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} Store · Proyecto de demostración
          </p>
          <a
            href="#"
            className="inline-flex h-11 items-center gap-2 rounded-full px-3 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Volver arriba
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
