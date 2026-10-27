import { Injectable } from '@nestjs/common';

export interface PaypalPurchaseUnit {
  amount?: { value?: string; currency_code?: string };
}

export interface PaypalOrder {
  id: string;
  status: string;
  purchase_units?: PaypalPurchaseUnit[];
}

export class PaypalApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PaypalApiError';
  }
}

@Injectable()
export class PaypalClient {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  private get baseUrl(): string {
    return process.env.PAYPAL_API_BASE ?? 'https://api-m.sandbox.paypal.com';
  }

  private get clientId(): string {
    return process.env.PAYPAL_CLIENT_ID ?? '';
  }

  private get clientSecret(): string {
    return process.env.PAYPAL_CLIENT_SECRET ?? '';
  }

  async createOrder(amount: string, currency = 'USD'): Promise<PaypalOrder> {
    return this.request<PaypalOrder>('POST', '/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount } }],
    });
  }

  async getOrder(orderId: string): Promise<PaypalOrder> {
    return this.request<PaypalOrder>('GET', `/v2/checkout/orders/${orderId}`);
  }

  async captureOrder(orderId: string): Promise<PaypalOrder> {
    return this.request<PaypalOrder>('POST', `/v2/checkout/orders/${orderId}/capture`);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new PaypalApiError(response.status, await response.text());
    }

    return (await response.json()) as T;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new PaypalApiError(
        500,
        'Credenciales de PayPal no configuradas (PAYPAL_CLIENT_ID/SECRET)',
      );
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new PaypalApiError(response.status, await response.text());
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in?: number;
    };

    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

    return this.accessToken;
  }
}
