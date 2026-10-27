import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/auth-provider';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Terral — Objetos para vivir mejor',
    template: '%s · Terral',
  },
  description: 'Tienda online de objetos elegidos, con pagos mediante PayPal Sandbox.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
