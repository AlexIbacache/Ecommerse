import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-secondary/40">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <p className="font-display text-lg font-semibold">Terral</p>
          <p className="text-sm text-muted-foreground">
            Objetos elegidos para vivir mejor.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold">Tienda</p>
          <Link href="/productos" className="block text-muted-foreground hover:text-foreground">
            Catálogo
          </Link>
          <Link href="/carrito" className="block text-muted-foreground hover:text-foreground">
            Carrito
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold">Cuenta</p>
          <Link href="/login" className="block text-muted-foreground hover:text-foreground">
            Ingresar
          </Link>
          <Link href="/registro" className="block text-muted-foreground hover:text-foreground">
            Crear cuenta
          </Link>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Pagos</p>
          <p>PayPal Sandbox (entorno de prueba).</p>
          <p>No se realizan transacciones con dinero real.</p>
        </div>
      </div>

      <div className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Terral. Proyecto de demostración.
      </div>
    </footer>
  );
}
