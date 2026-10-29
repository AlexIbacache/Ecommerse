'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { loginSchema } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });

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
      await login(parsed.data.email, parsed.data.password);
      toast.success('Sesión iniciada');
      router.push('/');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page flex min-h-[72vh] items-center justify-center py-12 sm:py-16">
      <form
        className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6 shadow-md sm:p-10"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="space-y-2">
          <p className="eyebrow">Acceso</p>
          <h1 className="text-3xl font-normal tracking-[-0.03em] sm:text-4xl">Ingresar</h1>
          <p className="text-sm text-muted-foreground">
            Accedé a tu cuenta para comprar y ver tus pedidos.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {fieldErrors.email && (
            <p id="email-error" role="alert" className="text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Contraseña
          </label>
          <Input
            id="password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldErrors.password && (
            <p id="password-error" role="alert" className="text-sm text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="inline-flex min-h-11 items-center font-medium text-accent underline-offset-4 hover:underline">
            Crear cuenta
          </Link>
        </p>
      </form>
    </div>
  );
}
