import Link from 'next/link';

const linkClass =
  'block w-fit rounded-sm py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function Footer() {
  return (
    <footer className="dark mt-20 rounded-t-2xl bg-background text-foreground">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-display text-xl font-medium tracking-[-0.03em]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-glow" />
            store
          </p>
          <p className="text-sm text-muted-foreground">
            Objetos elegidos para vivir mejor.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="eyebrow pb-1">Tienda</p>
          <Link href="/productos" className={linkClass}>
            Catálogo
          </Link>
          <Link href="/carrito" className={linkClass}>
            Carrito
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="eyebrow pb-1">Cuenta</p>
          <Link href="/login" className={linkClass}>
            Ingresar
          </Link>
          <Link href="/registro" className={linkClass}>
            Crear cuenta
          </Link>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="eyebrow pb-1">Pagos</p>
          <p>PayPal Sandbox (entorno de prueba).</p>
          <p>No se realizan transacciones con dinero real.</p>
        </div>
      </div>

      <div className="border-t border-border py-6 text-center font-mono text-xs text-muted-foreground">
        © {new Date().getFullYear()} Store · Proyecto de demostración
      </div>
    </footer>
  );
}
