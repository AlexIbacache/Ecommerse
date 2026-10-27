'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Search, ShoppingBag, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';

export function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);
  const cartCount = useCartStore((state) => state.count());

  useEffect(() => {
    setMounted(true);
  }, []);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = search.trim();
    router.push(term ? `/productos?q=${encodeURIComponent(term)}` : '/productos');
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  const accountLinks =
    status === 'authenticated' && user ? (
      <>
        <Link href="/cuenta" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <UserRound className="h-4 w-4" />
          {user.name}
        </Link>
        {user.role === 'ADMINISTRADOR' && (
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            Panel
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Salir
        </button>
      </>
    ) : (
      <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <UserRound className="h-4 w-4" />
        Ingresar
      </Link>
    );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Terral</SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-4 text-base">
              <Link href="/">Inicio</Link>
              <Link href="/productos">Productos</Link>
              <Link href="/carrito" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Carrito {mounted && cartCount > 0 ? `(${cartCount})` : ''}
              </Link>
              <Link href="/cuenta">Mi cuenta</Link>
              <Link href="/login">Ingresar</Link>
            </nav>
            <form onSubmit={submitSearch} className="mt-6 flex gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar…"
                aria-label="Buscar productos"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
              <Button type="submit" size="icon" aria-label="Buscar">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </SheetContent>
        </Sheet>

        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          Terral
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Inicio
          </Link>
          <Link href="/productos" className="text-muted-foreground hover:text-foreground">
            Productos
          </Link>
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden w-64 items-center md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar…"
              aria-label="Buscar productos"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-5 md:ml-4">
          <Link
            href="/carrito"
            className="relative flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            aria-label="Carrito"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline">Carrito</span>
            {mounted && cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          {accountLinks}
        </div>
      </div>
    </header>
  );
}
