'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Search, ShoppingBag, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { ProductsMenu } from '@/components/products-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getCategories, getProducts } from '@/lib/catalog';
import type { Category, ProductListItem } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);
  const cartCount = useCartStore((state) => state.count());

  const [categories, setCategories] = useState<Category[]>([]);
  const [latest, setLatest] = useState<ProductListItem | null>(null);

  useEffect(() => {
    setMounted(true);
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    getProducts({ sort: 'createdAt_desc', pageSize: 1 })
      .then((result) => setLatest(result.data[0] ?? null))
      .catch(() => setLatest(null));
  }, []);

  // Respaldo: cualquier cambio de ruta cierra el menú móvil.
  useEffect(() => setMenuOpen(false), [pathname]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setMenuOpen(false);
    const term = search.trim();
    router.push(term ? `/productos?q=${encodeURIComponent(term)}` : '/productos');
  }

  async function handleLogout() {
    await logout();
    setConfirmLogout(false);
    toast.success('Cerraste sesión');
    router.push('/');
  }

  const accountLinks =
    status === 'authenticated' && user ? (
      <>
        <Link
          href="/cuenta"
          aria-label={`Mi cuenta (${user.name})`}
          className="flex h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <UserRound className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
        </Link>
        {user.role === 'ADMINISTRADOR' && (
          <Link href="/admin" className="hidden h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
            Panel
          </Link>
        )}
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          className="hidden h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          Salir
        </button>
      </>
    ) : (
      <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <UserRound className="h-4 w-4" />
        Ingresar
      </Link>
    );

  return (
    <header className="dark sticky top-0 z-40 border-b bg-background/95 text-foreground shadow-md backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-3 sm:gap-4">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>store</SheetTitle>
            </SheetHeader>
            <nav
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) setMenuOpen(false);
              }}
              className="mt-8 flex flex-col gap-1 text-base [&>a]:flex [&>a]:min-h-11 [&>a]:items-center [&>a]:rounded-md [&>a]:px-2 [&>a:hover]:bg-secondary">
              <Link href="/">Inicio</Link>
              <Link href="/productos">Productos</Link>
              {categories.length > 0 && (
                <div className="mb-1 ml-3 flex flex-col border-l pl-3">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/productos?category=${category.slug}`}
                      className="flex min-h-11 items-center rounded-md px-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/carrito" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Carrito {mounted && cartCount > 0 ? `(${cartCount})` : ''}
              </Link>
              <Link href="/cuenta">Mi cuenta</Link>
              {status === 'authenticated' && user ? (
                <>
                  {user.role === 'ADMINISTRADOR' && <Link href="/admin">Panel</Link>}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmLogout(true);
                    }}
                    className="flex min-h-11 items-center rounded-md px-2 text-left hover:bg-secondary"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link href="/login">Ingresar</Link>
              )}
            </nav>
            <form onSubmit={submitSearch} className="mt-6 flex gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar…"
                aria-label="Buscar productos"
                className="h-11 w-full rounded-full border border-input bg-card px-4 text-base focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
              <Button type="submit" size="icon" aria-label="Buscar">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex h-11 items-center gap-2 rounded-sm font-display text-xl font-medium tracking-[-0.03em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-glow" />
          store
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 text-sm lg:flex">
          <Link
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={`inline-flex h-10 items-center rounded-full px-4 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              pathname === '/' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Inicio
          </Link>
          <ProductsMenu
            categories={categories}
            latest={latest}
            pathname={pathname}
            active={pathname.startsWith('/productos') || pathname.startsWith('/producto/')}
          />
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden w-56 items-center lg:flex xl:w-72">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar…"
              aria-label="Buscar productos"
              className="h-10 w-full rounded-full border border-input bg-card pl-10 pr-4 text-sm transition-[border-color,box-shadow] duration-200 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3 sm:gap-4 lg:ml-4">
          <Link
            href="/carrito"
            className="relative flex h-11 items-center gap-2 rounded-full border border-input/60 bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
            aria-label="Carrito"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[11px] font-medium text-accent-foreground">
                  {cartCount}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">Carrito</span>
          </Link>
          {accountLinks}
        </div>
      </div>
      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent>
          <DialogTitle>¿Cerrar sesión?</DialogTitle>
          <DialogDescription>
            Vas a salir de tu cuenta{user ? ` (${user.name})` : ''}. Tu carrito se mantiene en este dispositivo.
          </DialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleLogout}>
              Sí, salir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
