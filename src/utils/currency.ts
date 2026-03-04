/**
 * Format cents as a currency string (e.g., 123456 -> "$1,234.56")
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * Parse a currency input string to cents (e.g., "1,234.56" -> 123456)
 * Returns 0 for negative or invalid values.
 * Caps at MAX_CENTS to prevent integer overflow.
 */
export const MAX_CENTS = 999_999_999_99; // $9,999,999,999.99

export function parseCurrencyInput(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  const cents = Math.round(parsed * 100);
  return Math.min(cents, MAX_CENTS);
}
