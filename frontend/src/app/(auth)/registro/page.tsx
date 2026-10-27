'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { registerSchema } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = registerSchema.safeParse({ name, email, password });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      await register(parsed.data);
      toast.success('Cuenta creada. Iniciá sesión para continuar.');
      router.push('/login');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFieldErrors({ email: 'Ese email ya está registrado' });
      } else {
        toast.error(error instanceof ApiError ? error.message : 'Error al crear la cuenta');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <form
        className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-8 shadow-sm"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Registrate para comprar y consultar tus pedidos.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre
          </label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {fieldErrors.name && (
            <p className="text-xs text-destructive">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {fieldErrors.email && (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Ingresar
          </Link>
        </p>
      </form>
    </div>
  );
}
