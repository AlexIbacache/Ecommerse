'use client';

// Último recurso: reemplaza al layout raíz, por eso lleva su propio <html> y estilos mínimos.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050b1a',
          color: '#f1f5f9',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div role="alert">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0 }}>Algo salió mal</h1>
          <p style={{ color: '#94a3b8', margin: '12px 0 24px' }}>
            La aplicación no pudo cargarse. Intenta de nuevo.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: 44,
              padding: '0 24px',
              borderRadius: 999,
              border: 0,
              background: '#22d3ee',
              color: '#050b1a',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
