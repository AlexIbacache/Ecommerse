import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const PAYPAL_HOSTS = 'https://www.paypal.com https://www.sandbox.paypal.com https://*.paypal.com https://*.paypalobjects.com';

// Next inyecta scripts y estilos en línea, por eso 'unsafe-inline' (sin nonces por request).
// 'unsafe-eval' y ws: solo en desarrollo (React Refresh / HMR).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${PAYPAL_HOSTS}`,
  "style-src 'self' 'unsafe-inline'",
  // Las imágenes de producto son URLs externas que carga el administrador.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiUrl} ${PAYPAL_HOSTS}${isDev ? ' ws: wss:' : ''}`,
  `frame-src ${PAYPAL_HOSTS}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://www.paypal.com")' },
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
