/**
 * Rupee formatting utilities using Intl.NumberFormat.
 * Uses 'en-IN' locale for Indian number grouping (lakhs, crores).
 */

/**
 * Format a rupee amount using Indian number format with ₹ symbol.
 * e.g. 100000 → '₹1,00,000'
 */
export function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a rupee amount without the ₹ symbol.
 * e.g. 100000 → '1,00,000'
 */
export function formatRupeesPlain(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Parse a rupee string input (possibly with commas) to an integer.
 * Returns null if the string is empty or not parseable.
 * e.g. '1,50,000' → 150000, '' → null, 'abc' → null
 */
export function parseRupeeInput(value: string): number | null {
  const cleaned = value.replace(/[^0-9]/g, '')
  if (!cleaned) return null
  const n = parseInt(cleaned, 10)
  return isNaN(n) ? null : n
}
