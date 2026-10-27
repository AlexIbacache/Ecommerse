export function toCents(
  value: string | number | { toString(): string },
): number {
  return Math.round(Number(value.toString()) * 100);
}

export function toAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}
