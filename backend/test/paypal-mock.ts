import http from 'http';

export interface MockPaypalConfig {
  /** Estado que devuelve getOrder tras crear la orden: APPROVED (default) o COMPLETED. */
  orderStatus?: 'APPROVED' | 'COMPLETED';
  /** Resultado del capture: COMPLETED (default) o DECLINED. */
  captureStatus?: 'COMPLETED' | 'DECLINED';
  /** Importe distinto para simular inconsistencia de monto. */
  amountOverride?: string;
  /** Simula error de comunicación: todas las llamadas fallan con 500. */
  failRequests?: boolean;
}

export interface PaypalMockServer {
  url: string;
  close: () => Promise<void>;
}

export async function startPaypalMock(
  config: MockPaypalConfig = {},
): Promise<PaypalMockServer> {
  const orders = new Map<string, { id: string; amount: string }>();
  let counter = 0;

  const server = http.createServer((req, res) => {
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    const readBody = (): Promise<Record<string, unknown>> =>
      new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.on('end', () => resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {}));
      });

    void (async () => {
      const url = req.url ?? '';

      if (req.method === 'POST' && url === '/v1/oauth2/token') {
        send(200, { access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
        return;
      }

      if (config.failRequests) {
        send(500, { name: 'INTERNAL_SERVER_ERROR' });
        return;
      }

      if (req.method === 'POST' && url === '/v2/checkout/orders') {
        const body = await readBody();
        const id = `PAYPAL-ORDER-${++counter}`;
        const amount =
          config.amountOverride ??
          (body.purchase_units as { amount: { value: string } }[])?.[0]?.amount?.value ??
          '0.00';
        orders.set(id, { id, amount });
        send(201, { id, status: 'CREATED' });
        return;
      }

      const getMatch = url.match(/^\/v2\/checkout\/orders\/([^/]+)$/);
      const captureMatch = url.match(/^\/v2\/checkout\/orders\/([^/]+)\/capture$/);

      if (req.method === 'GET' && getMatch) {
        const order = orders.get(getMatch[1]);
        if (!order) {
          send(404, {});
          return;
        }
        send(200, {
          id: order.id,
          status: config.orderStatus ?? 'APPROVED',
          purchase_units: [
            { amount: { currency_code: 'USD', value: order.amount } },
          ],
        });
        return;
      }

      if (req.method === 'POST' && captureMatch) {
        const order = orders.get(captureMatch[1]);
        if (!order) {
          send(404, {});
          return;
        }
        if (config.captureStatus === 'DECLINED') {
          send(422, { name: 'UNPROCESSABLE_ENTITY' });
          return;
        }
        send(200, {
          id: `${order.id}-CAPTURE`,
          status: 'COMPLETED',
          purchase_units: [
            { amount: { currency_code: 'USD', value: order.amount } },
          ],
        });
        return;
      }

      send(404, {});
    })().catch(() => send(500, {}));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
