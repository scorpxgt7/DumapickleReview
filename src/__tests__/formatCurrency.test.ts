import { describe, it, expect } from 'vitest'
import formatCurrency from '../utils/formatCurrency'

describe('formatCurrency', () => {
  it('formats positive numbers', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00')
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats negative numbers with minus sign', () => {
    expect(formatCurrency(-50)).toBe('-$50.00')
  })

  it('parses numeric strings', () => {
    expect(formatCurrency('1000')).toBe('$1,000.00')
    expect(formatCurrency('  250.5 ')).toBe('$250.50')
  })

  it('returns fallback for null/undefined', () => {
    expect(formatCurrency(null)).toBe('$0.00')
    expect(formatCurrency(undefined)).toBe('$0.00')
  })

  it('returns fallback for NaN and non-numeric strings', () => {
    expect(formatCurrency(NaN)).toBe('$0.00')
    expect(formatCurrency('abc')).toBe('$0.00')
  })
})
