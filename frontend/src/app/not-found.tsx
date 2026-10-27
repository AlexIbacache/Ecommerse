import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-semibold">Producto no encontrado</h1>
      <p className="mt-2 text-muted-foreground">
        Puede que ya no esté disponible o que el enlace sea incorrecto.
      </p>
      <Button asChild className="mt-6">
        <Link href="/productos">Ver catálogo</Link>
      </Button>
    </div>
  );
}
