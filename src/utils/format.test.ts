import { describe, it, expect } from 'vitest'
import { formatRupees, parseRupeeInput } from '../utils/format'

describe('formatRupees', () => {
  it('formats 0 as ₹0', () => {
    // Intl.NumberFormat 'en-IN' may format as '₹0' or '₹ 0' (with narrow no-break space)
    // We test that it contains the ₹ symbol and the digit 0
    const result = formatRupees(0)
    expect(result).toMatch(/₹/)
    expect(result).toMatch(/0/)
  })

  it('formats 100000 in Indian style (1,00,000)', () => {
    const result = formatRupees(100_000)
    expect(result).toMatch(/₹/)
    // Should contain 1,00,000 grouping
    expect(result).toMatch(/1[,.]00[,.]000/)
  })

  it('formats 10000000 in Indian style (1,00,00,000)', () => {
    const result = formatRupees(10_000_000)
    expect(result).toMatch(/₹/)
    expect(result).toMatch(/1[,.]00[,.]00[,.]000/)
  })

  it('formats 500000 correctly', () => {
    const result = formatRupees(500_000)
    expect(result).toMatch(/5[,.]00[,.]000/)
  })

  it('formats 1500000 correctly', () => {
    const result = formatRupees(1_500_000)
    expect(result).toMatch(/15[,.]00[,.]000/)
  })

  it('returns a string', () => {
    expect(typeof formatRupees(12345)).toBe('string')
  })
})

describe('parseRupeeInput', () => {
  it('parses 1,50,000 → 150000', () => {
    expect(parseRupeeInput('1,50,000')).toBe(150_000)
  })

  it('parses empty string → null', () => {
    expect(parseRupeeInput('')).toBeNull()
  })

  it('parses "abc" → null', () => {
    expect(parseRupeeInput('abc')).toBeNull()
  })

  it('parses "0" → 0', () => {
    expect(parseRupeeInput('0')).toBe(0)
  })

  it('parses numeric string without commas', () => {
    expect(parseRupeeInput('500000')).toBe(500_000)
  })

  it('parses string with ₹ symbol', () => {
    expect(parseRupeeInput('₹1,00,000')).toBe(100_000)
  })

  it('parses string with mixed symbols', () => {
    expect(parseRupeeInput('₹ 10,00,000')).toBe(1_000_000)
  })

  it('handles whitespace-only string → null', () => {
    expect(parseRupeeInput('   ')).toBeNull()
  })

  it('handles "0" → 0, not null', () => {
    const result = parseRupeeInput('0')
    expect(result).toBe(0)
  })
})
