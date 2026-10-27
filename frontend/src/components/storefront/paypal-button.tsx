'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => {
        render: (element: HTMLElement) => Promise<void>;
      };
    };
  }
}

interface PaypalButtonProps {
  clientId: string;
  paypalOrderId: string;
  onApprove: (orderId: string) => void;
  onCancel: () => void;
  onError: () => void;
}

export function PaypalButton({
  clientId,
  paypalOrderId,
  onApprove,
  onCancel,
  onError,
}: PaypalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!clientId || !paypalOrderId) {
      return;
    }

    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current || !window.paypal) {
        return;
      }

      containerRef.current.innerHTML = '';

      window.paypal
        .Buttons({
          createOrder: () => paypalOrderId,
          onApprove: (data: { orderID: string }) => onApprove(data.orderID),
          onCancel: () => onCancel(),
          onError: () => onError(),
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
          },
        })
        .render(containerRef.current)
        .catch(() => setFailed(true));
    };

    if (window.paypal) {
      render();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId,
    )}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = render;
    script.onerror = () => setFailed(true);
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, paypalOrderId]);

  if (!clientId) {
    return (
      <p className="rounded-md border bg-secondary/40 p-4 text-sm text-muted-foreground">
        Para habilitar PayPal Sandbox, configurá{' '}
        <code className="font-mono">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> en el{' '}
        <code className="font-mono">.env</code>.
      </p>
    );
  }

  if (failed) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        No se pudo cargar PayPal. Intentá de nuevo.
      </p>
    );
  }

  return <div ref={containerRef} />;
}
