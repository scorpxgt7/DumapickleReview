export default function formatCurrency(value: number | string | null | undefined): string {
  // Sensible fallback for invalid inputs
  const FALLBACK = '$0.00'

  if (value === null || value === undefined) return FALLBACK

  // If it's a numeric string, try to parse
  let num: number
  if (typeof value === 'string') {
    // trim whitespace
    const trimmed = value.trim()
    if (trimmed.length === 0) return FALLBACK
    num = Number(trimmed)
  } else if (typeof value === 'number') {
    num = value
  } else {
    return FALLBACK
  }

  if (!isFinite(num) || Number.isNaN(num)) return FALLBACK

  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return formatter.format(num)
  } catch (e) {
    return FALLBACK
  }
}
