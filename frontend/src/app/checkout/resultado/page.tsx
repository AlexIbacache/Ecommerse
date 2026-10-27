import { RequireAuth } from '@/components/require-auth';
import { OrderResult } from '@/components/storefront/order-result';

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const id = orderId ? Number(orderId) : NaN;

  return (
    <RequireAuth>
      <OrderResult orderId={Number.isNaN(id) ? null : id} />
    </RequireAuth>
  );
}
