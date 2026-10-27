'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

function Loading() {
  return <p className="container-page py-12 text-sm text-muted-foreground">Cargando…</p>;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'anonymous') {
    return null;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const isAdmin = status === 'authenticated' && user?.role === 'ADMINISTRADOR';

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== 'ADMINISTRADOR') {
      router.replace('/');
    }
  }, [status, user, router]);

  if (status === 'loading') {
    return <Loading />;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
