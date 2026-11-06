/**
 * Comprehensive tests for the Indian Income Tax Calculator Engine
 *
 * Verifies:
 *   - FY 2024–25 (AY 2025–26) and FY 2025–26 (AY 2026–27)
 *   - New Regime (Section 115BAC) and Old Regime
 *   - Salary/Pension vs Business/Profession
 *   - Section 16(ia) standard deduction capping and restrictions
 *   - Section 87A rebate and statutory Marginal Relief under Section 87A proviso (b)
 *   - Surcharge slabs & Surcharge Marginal Relief
 *   - Section 288A (Taxable Income) & Section 288B (Tax Payable) rounding to nearest ₹10
 *   - Section 80A(2) deduction capping at Gross Total Income
 *   - Senior citizen slabs & 80D age-dependent limits
 *   - Invalid, negative, zero, and boundary inputs
 */

import { describe, it, expect } from 'vitest'
import {
  calculateTax,
  applySlabs,
  roundToNearestTen,
} from '../tax/calculator'
import { FY_2024_25_NEW, FY_2025_26_NEW } from '../tax/taxRules'

// ─── Section 288A & 288B Rounding ─────────────────────────────────────────────

describe('Statutory Rounding (Section 288A & Section 288B)', () => {
  it('rounds 0 to 0', () => {
    expect(roundToNearestTen(0)).toBe(0)
    expect(roundToNearestTen(-5)).toBe(0)
  })

  it('rounds down when last digit is less than 5', () => {
    expect(roundToNearestTen(124)).toBe(120)
    expect(roundToNearestTen(458_234)).toBe(458_230)
    expect(roundToNearestTen(1_000_001)).toBe(1_000_000)
    expect(roundToNearestTen(1_000_004)).toBe(1_000_000)
  })

  it('rounds up when last digit is 5 or more', () => {
    expect(roundToNearestTen(125)).toBe(130)
    expect(roundToNearestTen(458_236)).toBe(458_240)
    expect(roundToNearestTen(1_000_005)).toBe(1_000_010)
    expect(roundToNearestTen(1_000_009)).toBe(1_000_010)
  })

  it('leaves multiples of 10 unchanged', () => {
    expect(roundToNearestTen(500_000)).toBe(500_000)
    expect(roundToNearestTen(750_000)).toBe(750_000)
  })
})

// ─── Slab Math Helper ─────────────────────────────────────────────────────────

describe('applySlabs helper', () => {
  it('returns 0 for zero or exempt income', () => {
    expect(applySlabs(0, FY_2024_25_NEW.slabs)).toBe(0)
    expect(applySlabs(300_000, FY_2024_25_NEW.slabs)).toBe(0)
  })

  it('correctly taxes income above exemption in FY 2024–25 New Regime', () => {
    // ₹3,25,000 -> 5% on ₹25,000 = ₹1,250
    expect(applySlabs(325_000, FY_2024_25_NEW.slabs)).toBe(1250)
    // ₹7,00,000 -> 5% on ₹4,00,000 = ₹20,000
    expect(applySlabs(700_000, FY_2024_25_NEW.slabs)).toBe(20_000)
    // ₹10,00,000 -> 20,000 + (10% on 3,00,000 = 30,000) = ₹50,000
    expect(applySlabs(1_000_000, FY_2024_25_NEW.slabs)).toBe(50_000)
  })

  it('correctly taxes income in FY 2025–26 New Regime', () => {
    // Basic exemption is ₹4,00,000
    expect(applySlabs(400_000, FY_2025_26_NEW.slabs)).toBe(0)
    // ₹8,00,000 -> 5% on 4,00,000 = ₹20,000
    expect(applySlabs(800_000, FY_2025_26_NEW.slabs)).toBe(20_000)
    // ₹12,00,000 -> 20,000 + (10% on 4,00,000 = 40,000) = ₹60,000
    expect(applySlabs(1_200_000, FY_2025_26_NEW.slabs)).toBe(60_000)
  })
})

// ─── FY 2024–25 New Regime (AY 2025–26) - Salary ──────────────────────────────

describe('FY 2024–25 New Regime - Salary', () => {
  it('TC1: Zero income -> taxable income = 0, tax payable = 0', () => {
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 0,
      hasStandardDeduction: true,
    })
    expect(r.taxableIncome).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC2: Salary less than standard deduction -> standard deduction capped at gross salary', () => {
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 40_000,
      hasStandardDeduction: true,
    })
    // Cannot create negative salary under Section 16(ia)
    expect(r.standardDeduction).toBe(40_000)
    expect(r.taxableIncome).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC3: Salary ₹5,00,000 -> taxable ₹4,25,000 -> 87A rebate wipes tax -> total = 0', () => {
    // 5,00,000 - 75,000 = 4,25,000
    // Tax: 5% of (4,25,000 - 3,00,000) = 5% of 1,25,000 = 6,250
    // Rebate: 6,250 <= 25,000 -> rebate = 6,250
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 500_000,
      hasStandardDeduction: true,
    })
    expect(r.standardDeduction).toBe(75_000)
    expect(r.taxableIncome).toBe(425_000)
    expect(r.taxBeforeRebate).toBe(6_250)
    expect(r.rebate87A).toBe(6_250)
    expect(r.taxAfterRebate).toBe(0)
    expect(r.cess).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC4: Gross salary ₹7,75,000 -> taxable ₹7,00,000 -> full 87A rebate of ₹25,000 -> zero tax', () => {
    // Exactly at the ₹7L rebate threshold
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 775_000,
      hasStandardDeduction: true,
    })
    expect(r.taxableIncome).toBe(700_000)
    expect(r.taxBeforeRebate).toBe(20_000)
    expect(r.rebate87A).toBe(20_000)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC5: Section 87A Marginal Relief applies when income marginally exceeds ₹7,00,000', () => {
    // Gross salary ₹7,85,000 -> taxable ₹7,10,000 (exceeds ₹7L by ₹10,000)
    // Slab tax on ₹7,10,000 = 20,000 + (10% of 10,000 = 1,000) = ₹21,000
    // Excess income over ₹7L = ₹10,000
    // Under Section 87A proviso (b): Rebate = 21,000 - 10,000 = ₹11,000!
    // Tax after rebate is restricted to excess income: ₹10,000
    // 4% Cess on 10,000 = 400 -> Total Tax = ₹10,400 (instead of ₹21,840!)
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 785_000,
      hasStandardDeduction: true,
    })
    expect(r.taxableIncome).toBe(710_000)
    expect(r.taxBeforeRebate).toBe(21_000)
    expect(r.rebate87A).toBe(11_000)
    expect(r.rebate87AMarginalReliefApplied).toBe(true)
    expect(r.taxAfterRebate).toBe(10_000)
    expect(r.cess).toBe(400)
    expect(r.totalTaxPayable).toBe(10_400)
  })

  it('TC6: Salary ₹10,00,000 -> beyond 87A marginal relief -> full normal slab tax', () => {
    // 10,00,000 - 75,000 = 9,25,000
    // Slabs: 0-3L=0, 3-7L=20000, 7-9.25L (2.25L @ 10%) = 22500 -> 42500
    // Cess: 4% of 42500 = 1700 -> Total = 44200
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 1_000_000,
      hasStandardDeduction: true,
    })
    expect(r.taxableIncome).toBe(925_000)
    expect(r.taxBeforeRebate).toBe(42_500)
    expect(r.rebate87A).toBe(0)
    expect(r.rebate87AMarginalReliefApplied).toBe(false)
    expect(r.cess).toBe(1_700)
    expect(r.totalTaxPayable).toBe(44_200)
  })

  it('TC7: Salary ₹15,00,000 -> correct multi-slab tax', () => {
    // 15,00,000 - 75,000 = 14,25,000
    // Slabs: 0-3L=0, 3-7L=20000, 7-10L=30000, 10-12L=30000, 12-14.25L=45000 -> 125000
    // Cess: 4% of 125000 = 5000 -> Total = 130000
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 1_500_000,
      hasStandardDeduction: true,
    })
    expect(r.taxableIncome).toBe(1_425_000)
    expect(r.taxBeforeRebate).toBe(125_000)
    expect(r.cess).toBe(5_000)
    expect(r.totalTaxPayable).toBe(130_000)
  })
})

// ─── FY 2025–26 New Regime (AY 2026–27) - Budget 2025 ─────────────────────────

describe('FY 2025–26 New Regime - Budget 2025 Updates', () => {
  it('TC8: Salary ₹12,75,000 -> SD ₹75,000 -> taxable ₹12,00,000 -> rebate ₹60,000 -> ZERO tax', () => {
    // Budget 2025 milestone: Nil tax up to ₹12 lakh taxable income
    const r = calculateTax('2025-26', 'new', 'salary', 'below60', {
      grossSalary: 1_275_000,
      hasStandardDeduction: true,
    })
    expect(r.standardDeduction).toBe(75_000)
    expect(r.taxableIncome).toBe(1_200_000)
    expect(r.taxBeforeRebate).toBe(60_000)
    expect(r.rebate87A).toBe(60_000)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC9: Salary ₹13,00,000 -> taxable ₹12,25,000 -> Section 87A Marginal Relief applies!', () => {
    // Gross 13,00,000 - 75,000 = 12,25,000
    // Slab tax on 12,25,000:
    // 0-4L: 0, 4-8L (4L @ 5%) = 20000, 8-12L (4L @ 10%) = 40000, 12-12.25L (25k @ 15%) = 3750 -> Total = 63750
    // Excess income over ₹12L threshold = ₹25,000
    // Marginal relief under Section 87A proviso (b):
    // Rebate = 63,750 - 25,000 = ₹38,750!
    // Tax after rebate is restricted to the excess income: ₹25,000!
    // Cess 4% of 25,000 = 1,000 -> Total Tax = ₹26,000
    const r = calculateTax('2025-26', 'new', 'salary', 'below60', {
      grossSalary: 1_300_000,
      hasStandardDeduction: true,
    })
    expect(r.taxableIncome).toBe(1_225_000)
    expect(r.taxBeforeRebate).toBe(63_750)
    expect(r.rebate87A).toBe(38_750)
    expect(r.rebate87AMarginalReliefApplied).toBe(true)
    expect(r.taxAfterRebate).toBe(25_000)
    expect(r.cess).toBe(1_000)
    expect(r.totalTaxPayable).toBe(26_000)
  })

  it('TC10: Salary ₹14,00,000 -> exceeds 87A marginal relief range -> normal slabs apply', () => {
    // Gross 14,00,000 - 75,000 = 13,25,000
    // Slab tax: 20000 + 40000 + (1.25L @ 15% = 18750) = 78750
    // Excess income over ₹12L = 1,25,000. Since tax (78750) < excess (125000), rebate = 0
    // Cess = 4% of 78750 = 3150 -> Total = 81900
    const r = calculateTax('2025-26', 'new', 'salary', 'below60', {
      grossSalary: 1_400_000,
      hasStandardDeduction: true,
    })
    expect(r.taxableIncome).toBe(1_325_000)
    expect(r.taxBeforeRebate).toBe(78_750)
    expect(r.rebate87A).toBe(0)
    expect(r.cess).toBe(3_150)
    expect(r.totalTaxPayable).toBe(81_900)
  })
})

// ─── Old Regime - Salary ──────────────────────────────────────────────────────

describe('Old Regime - Salary & Chapter VI-A Deductions', () => {
  it('TC11: Below 60, Salary ₹5,00,000 -> SD ₹50k -> taxable ₹4,50,000 -> 87A rebate -> tax = 0', () => {
    // 5,00,000 - 50,000 = 4,50,000
    // Slabs: 0-2.5L=0, 2.5-4.5L (2L @ 5%) = 10000
    // Rebate 87A: 10000 <= 12500 -> rebate = 10000 -> tax = 0
    const r = calculateTax('2024-25', 'old', 'salary', 'below60', {
      grossSalary: 500_000,
      hasStandardDeduction: true,
    })
    expect(r.standardDeduction).toBe(50_000)
    expect(r.taxableIncome).toBe(450_000)
    expect(r.taxBeforeRebate).toBe(10_000)
    expect(r.rebate87A).toBe(10_000)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC12: Salary ₹7,00,000 with 80C=₹1,50,000 -> taxable ₹5,00,000 -> rebate -> tax = 0', () => {
    // 7,00,000 - 50,000 (SD) - 1,50,000 (80C) = 5,00,000
    // Slabs: 2.5L-5L = 12500 -> rebate 12500 -> tax = 0
    const r = calculateTax('2024-25', 'old', 'salary', 'below60', {
      grossSalary: 700_000,
      hasStandardDeduction: true,
      section80C: 150_000,
    })
    expect(r.taxableIncome).toBe(500_000)
    expect(r.taxBeforeRebate).toBe(12_500)
    expect(r.rebate87A).toBe(12_500)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC13: 80C is strictly capped at ₹1,50,000 even if entered higher', () => {
    const r = calculateTax('2024-25', 'old', 'salary', 'below60', {
      grossSalary: 1_000_000,
      hasStandardDeduction: true,
      section80C: 250_000,
    })
    expect(r.section80C).toBe(150_000)
    expect(r.warnings.some(w => w.includes('capped') && w.includes('₹1,50,000'))).toBe(true)
  })

  it('TC14: Section 80D health insurance limits adjust for senior citizen status', () => {
    // Non-senior self: limit is ₹25,000
    const r1 = calculateTax('2024-25', 'old', 'salary', 'below60', {
      grossSalary: 1_000_000,
      hasStandardDeduction: true,
      section80D_self: 40_000,
    })
    expect(r1.section80D).toBe(25_000)

    // Senior citizen self: limit is ₹50,000
    const r2 = calculateTax('2024-25', 'old', 'salary', '60to79', {
      grossSalary: 1_000_000,
      hasStandardDeduction: true,
      section80D_self: 40_000,
    })
    expect(r2.section80D).toBe(40_000)

    // Parents senior citizen: additional ₹50,000 cap
    const r3 = calculateTax('2024-25', 'old', 'salary', 'below60', {
      grossSalary: 1_000_000,
      hasStandardDeduction: true,
      section80D_self: 20_000,
      section80D_parents: 45_000,
      parentsSeniorCitizen: true,
    })
    expect(r3.section80D).toBe(65_000) // 20k self + 45k parents
  })

  it('TC15: Senior Citizen (60–79) has higher basic exemption of ₹3,00,000 in Old Regime', () => {
    const r = calculateTax('2024-25', 'old', 'salary', '60to79', {
      grossSalary: 400_000,
      hasStandardDeduction: true,
    })
    // 4,00,000 - 50,000 = 3,50,000
    // Slabs: 0-3L=0, 3-3.5L (50k @ 5%) = 2500
    // Rebate 87A: 2500 -> total = 0
    expect(r.taxableIncome).toBe(350_000)
    expect(r.taxBeforeRebate).toBe(2_500)
    expect(r.rebate87A).toBe(2_500)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC16: Super Senior Citizen (80+) has basic exemption of ₹5,00,000 in Old Regime', () => {
    const r = calculateTax('2024-25', 'old', 'salary', '80plus', {
      grossSalary: 550_000,
      hasStandardDeduction: true,
    })
    // 5,50,000 - 50,000 = 5,00,000
    // Super senior basic exemption is ₹5,00,000 -> Tax is Nil
    expect(r.taxableIncome).toBe(500_000)
    expect(r.taxBeforeRebate).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC17: Section 80A(2) — Chapter VI-A deductions cannot exceed Gross Total Income', () => {
    // Gross salary ₹1,00,000 - SD ₹50,000 = Gross Total Income ₹50,000
    // Entered 80C = ₹1,50,000
    const r = calculateTax('2024-25', 'old', 'salary', 'below60', {
      grossSalary: 100_000,
      hasStandardDeduction: true,
      section80C: 150_000,
    })
    // Deductions cannot create a negative loss under Chapter VI-A
    expect(r.taxableIncome).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
  })
})

// ─── Business / Professional Income ───────────────────────────────────────────

describe('Business / Professional Income Path', () => {
  it('TC18: Standard deduction is strictly ₹0 for business income across all regimes', () => {
    const rNew = calculateTax('2024-25', 'new', 'business', 'below60', {
      netProfitBeforeTax: 800_000,
    })
    expect(rNew.standardDeduction).toBe(0)
    expect(rNew.taxableIncome).toBe(800_000)

    const rOld = calculateTax('2024-25', 'old', 'business', 'below60', {
      netProfitBeforeTax: 800_000,
    })
    expect(rOld.standardDeduction).toBe(0)
    expect(rOld.taxableIncome).toBe(800_000)
  })

  it('TC19: Business profit ₹7,00,000 in New Regime qualifies for 87A rebate', () => {
    // Taxable = 7,00,000 -> Slabs: 3-7L (4L @ 5%) = 20,000
    // Rebate = 20,000 -> total tax = 0
    const r = calculateTax('2024-25', 'new', 'business', 'below60', {
      netProfitBeforeTax: 700_000,
    })
    expect(r.taxableIncome).toBe(700_000)
    expect(r.taxBeforeRebate).toBe(20_000)
    expect(r.rebate87A).toBe(20_000)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TC20: Business profit with 80C deduction in Old Regime', () => {
    const r = calculateTax('2024-25', 'old', 'business', 'below60', {
      netProfitBeforeTax: 600_000,
      section80C: 100_000,
    })
    // 6,00,000 - 100,000 (80C) = 5,00,000
    // Old regime tax on 5L = 12500 -> rebate = 12500 -> total = 0
    expect(r.taxableIncome).toBe(500_000)
    expect(r.totalTaxPayable).toBe(0)
  })
})

// ─── Surcharge & Surcharge Marginal Relief ─────────────────────────────────────

describe('Surcharge & Marginal Relief', () => {
  it('TC21: Income > ₹50 Lakh incurs 10% surcharge', () => {
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 6_000_000, // 60L -> 59.25L taxable
      hasStandardDeduction: true,
    })
    expect(r.taxableIncome).toBe(5_925_000)
    expect(r.surcharge).toBeGreaterThan(0)
  })

  it('TC22: Statutory Surcharge Marginal Relief at ₹50 Lakh boundary', () => {
    const above = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 5_100_000, // 50.25L taxable
      hasStandardDeduction: true,
    })
    const at = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 5_075_000, // 50L taxable
      hasStandardDeduction: true,
    })
    // Statutory rule: (Tax + Surcharge at 50.25L) - (Tax at 50L) <= Excess Income (25,000)
    const taxPlusSurchargeAbove = above.taxAfterRebate + above.surcharge
    const taxPlusSurchargeAt = at.taxAfterRebate + at.surcharge
    const excessIncome = above.taxableIncome - at.taxableIncome

    expect(taxPlusSurchargeAbove - taxPlusSurchargeAt).toBeLessThanOrEqual(excessIncome)
    expect(above.surchargeMarginalReliefApplied).toBe(true)
  })
})

// ─── Section 288A Rounding of Taxable Income ──────────────────────────────────

describe('Section 288A Rounding of Arbitrary Numbers', () => {
  it('TC23: Unrounded gross salary rounds taxable income to nearest ₹10', () => {
    // Gross: 12,34,567 -> minus SD 75,000 = 11,59,567
    // Last digit 7 >= 5 -> rounded to 11,59,570
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 1_234_567,
      hasStandardDeduction: true,
    })
    expect(r.unroundedTaxableIncome).toBe(1_159_567)
    expect(r.taxableIncome).toBe(1_159_570)
    expect(r.totalTaxPayable % 10).toBe(0) // Section 288B rounded
  })
})

// ─── Input Validation & Boundary Checks ───────────────────────────────────────

describe('Validation & Edge Cases', () => {
  it('TC24: Negative gross income returns 0 taxable income with warning', () => {
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: -5000,
      hasStandardDeduction: true,
    })
    expect(r.taxableIncome).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('TC25: Throws error for unsupported tax year', () => {
    expect(() => {
      // @ts-expect-error testing invalid year
      calculateTax('2022-23', 'new', 'salary', 'below60', { grossSalary: 500_000 })
    }).toThrow(/unsupported tax year/i)
  })
})

// ─── Independent Documented Calculation Fixtures ──────────────────────────────

describe('Independent Calculation Fixtures (Adversarial Verification)', () => {
  it('Fixture 1: FY 24–25 New Salary at exact zero-tax threshold (Gross ₹7.75L -> Taxable ₹7L -> Tax ₹0)', () => {
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 775_000,
      hasStandardDeduction: true,
    })
    expect(r.grossIncome).toBe(775_000)
    expect(r.standardDeduction).toBe(75_000)
    expect(r.taxableIncome).toBe(700_000)
    expect(r.taxBeforeRebate).toBe(20_000)
    expect(r.rebate87A).toBe(20_000)
    expect(r.rebate87AMarginalReliefApplied).toBe(false)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('Fixture 2: FY 24–25 New Salary in Marginal Relief zone (Gross ₹7.85L -> Taxable ₹7.10L -> Tax ₹10,400)', () => {
    const r = calculateTax('2024-25', 'new', 'salary', 'below60', {
      grossSalary: 785_000,
      hasStandardDeduction: true,
    })
    expect(r.grossIncome).toBe(785_000)
    expect(r.standardDeduction).toBe(75_000)
    expect(r.taxableIncome).toBe(710_000)
    expect(r.taxBeforeRebate).toBe(21_000)
    // Excess income = ₹10,000; Tax before rebate = ₹21,000; Rebate = ₹11,000
    expect(r.rebate87A).toBe(11_000)
    expect(r.rebate87AMarginalReliefApplied).toBe(true)
    expect(r.taxAfterRebate).toBe(10_000)
    // Cess 4% of ₹10,000 = ₹400
    expect(r.cess).toBe(400)
    expect(r.totalTaxPayable).toBe(10_400)
  })

  it('Fixture 3: FY 24–25 New Business Profit above marginal relief phaseout (Net Profit ₹7.25L -> Tax ₹23,400)', () => {
    const r = calculateTax('2024-25', 'new', 'business', 'below60', {
      netProfitBeforeTax: 725_000,
    })
    expect(r.standardDeduction).toBe(0)
    expect(r.taxableIncome).toBe(725_000)
    expect(r.taxBeforeRebate).toBe(22_500)
    expect(r.rebate87A).toBe(0)
    expect(r.rebate87AMarginalReliefApplied).toBe(false)
    expect(r.cess).toBe(900)
    expect(r.totalTaxPayable).toBe(23_400)
  })

  it('Fixture 4: FY 25–26 New Salary at revised zero-tax threshold (Gross ₹12.75L -> Taxable ₹12L -> Tax ₹0)', () => {
    const r = calculateTax('2025-26', 'new', 'salary', 'below60', {
      grossSalary: 1_275_000,
      hasStandardDeduction: true,
    })
    expect(r.standardDeduction).toBe(75_000)
    expect(r.taxableIncome).toBe(1_200_000)
    expect(r.taxBeforeRebate).toBe(60_000)
    expect(r.rebate87A).toBe(60_000)
    expect(r.rebate87AMarginalReliefApplied).toBe(false)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('Fixture 5: FY 25–26 New Salary in Marginal Relief zone (Gross ₹12.95L -> Taxable ₹12.20L -> Tax ₹20,800)', () => {
    const r = calculateTax('2025-26', 'new', 'salary', 'below60', {
      grossSalary: 1_295_000,
      hasStandardDeduction: true,
    })
    expect(r.standardDeduction).toBe(75_000)
    expect(r.taxableIncome).toBe(1_220_000)
    expect(r.taxBeforeRebate).toBe(63_000)
    // Excess income = ₹20,000; Slab tax = ₹63,000; Rebate = ₹43,000
    expect(r.rebate87A).toBe(43_000)
    expect(r.rebate87AMarginalReliefApplied).toBe(true)
    expect(r.taxAfterRebate).toBe(20_000)
    // Cess 4% of ₹20,000 = ₹800
    expect(r.cess).toBe(800)
    expect(r.totalTaxPayable).toBe(20_800)
  })

  it('Fixture 6: FY 24–25 Old Salary Senior Citizen with 80C and 80D (Gross ₹9L -> Taxable ₹6.10L -> Tax ₹33,280)', () => {
    const r = calculateTax('2024-25', 'old', 'salary', '60to79', {
      grossSalary: 900_000,
      hasStandardDeduction: true,
      section80C: 150_000,
      section80D_self: 50_000,
      section80D_parents: 40_000,
      parentsSeniorCitizen: true,
    })
    expect(r.standardDeduction).toBe(50_000)
    expect(r.section80C).toBe(150_000)
    expect(r.section80D).toBe(90_000)
    expect(r.totalDeductions).toBe(290_000)
    expect(r.taxableIncome).toBe(610_000)
    // Basic exemption for 60-79 is 3L.
    // 3L to 5L @ 5% = 10,000; 5L to 6.1L @ 20% = 22,000 -> Base tax = 32,000.
    expect(r.taxBeforeRebate).toBe(32_000)
    expect(r.rebate87A).toBe(0)
    expect(r.cess).toBe(1280)
    expect(r.totalTaxPayable).toBe(33_280)
  })

  it('Fixture 7: FY 24–25 Old Super Senior Citizen (80+) basic exemption up to ₹5 Lakh (Income ₹5L -> Tax ₹0)', () => {
    const r = calculateTax('2024-25', 'old', 'salary', '80plus', {
      grossSalary: 550_000,
      hasStandardDeduction: true, // 50k SD -> 5L taxable
    })
    expect(r.taxableIncome).toBe(500_000)
    expect(r.taxBeforeRebate).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('Fixture 8: Section 80A(2) statutory capping at Gross Total Income', () => {
    const r = calculateTax('2024-25', 'old', 'salary', 'below60', {
      grossSalary: 180_000,
      hasStandardDeduction: true, // SD = 50k -> GTI = 130k
      section80C: 150_000,
    })
    expect(r.standardDeduction).toBe(50_000)
    expect(r.totalDeductions).toBe(180_000) // 50k SD + 130k capped 80C
    expect(r.taxableIncome).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
    expect(r.warnings.some(w => w.includes('Section 80A(2)'))).toBe(true)
  })

  it('Fixture 9: Surcharge Marginal Relief at ₹50 Lakh boundary in New Regime (Net Profit ₹51L -> Tax ₹13,41,600)', () => {
    const r = calculateTax('2024-25', 'new', 'business', 'below60', {
      netProfitBeforeTax: 5_100_000,
    })
    expect(r.taxableIncome).toBe(5_100_000)
    expect(r.taxBeforeRebate).toBe(1_220_000)
    expect(r.surchargeMarginalReliefApplied).toBe(true)
    expect(r.surcharge).toBe(70_000)
    expect(r.cess).toBe(51_600)
    expect(r.totalTaxPayable).toBe(1_341_600)
  })

  it('Fixture 10: Section 288A & 288B Rounding Rules (ends in 4 vs 5 vs 9)', () => {
    // 7,00,004 -> rounds down to 7,00,000
    const rDown = calculateTax('2024-25', 'new', 'business', 'below60', {
      netProfitBeforeTax: 700_004,
    })
    expect(rDown.taxableIncome).toBe(700_000)

    // 7,00,005 -> rounds up to 7,00,010
    const rUp5 = calculateTax('2024-25', 'new', 'business', 'below60', {
      netProfitBeforeTax: 700_005,
    })
    expect(rUp5.taxableIncome).toBe(700_010)

    // 7,00,009 -> rounds up to 7,00,010
    const rUp9 = calculateTax('2024-25', 'new', 'business', 'below60', {
      netProfitBeforeTax: 700_009,
    })
    expect(rUp9.taxableIncome).toBe(700_010)
  })
})

// ─── Tax Year 2026–27 (Income-tax Act, 2025) Dedicated Fixtures ──────────────

describe('Tax Year 2026–27 Fixtures (Income-tax Act, 2025)', () => {
  it('TY26-27 F1: Salaried under New Regime at exact zero-tax threshold (Gross ₹12.75L -> Taxable ₹12L -> Tax ₹0)', () => {
    const r = calculateTax('2026-27', 'new', 'salary', 'below60', {
      grossSalary: 1_275_000,
      hasStandardDeduction: true,
    })
    expect(r.governingAct).toBe('Income-tax Act, 2025 (as amended by Finance Act 2026)')
    expect(r.financialYearLabel).toBe('Tax Year 2026–27 (1 Apr 2026 – 31 Mar 2027)')
    expect(r.assessmentYearLabel).toBe('AY 2027–28')
    expect(r.grossIncome).toBe(1_275_000)
    expect(r.standardDeduction).toBe(75_000)
    expect(r.taxableIncome).toBe(1_200_000)
    expect(r.taxBeforeRebate).toBe(60_000)
    expect(r.rebate87A).toBe(60_000)
    expect(r.rebate87AMarginalReliefApplied).toBe(false)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TY26-27 F2: Salaried under New Regime in Marginal Relief zone (Gross ₹12.95L -> Taxable ₹12.20L -> Tax ₹20,800)', () => {
    const r = calculateTax('2026-27', 'new', 'salary', 'below60', {
      grossSalary: 1_295_000,
      hasStandardDeduction: true,
    })
    expect(r.standardDeduction).toBe(75_000)
    expect(r.taxableIncome).toBe(1_220_000)
    expect(r.taxBeforeRebate).toBe(63_000)
    // Excess income = 20,000; Tax before rebate = 63,000 -> Rebate = 43,000
    expect(r.rebate87A).toBe(43_000)
    expect(r.rebate87AMarginalReliefApplied).toBe(true)
    expect(r.taxAfterRebate).toBe(20_000)
    expect(r.cess).toBe(800)
    expect(r.totalTaxPayable).toBe(20_800)
  })

  it('TY26-27 F3: Business Profit in New Regime above marginal relief phaseout (Net ₹12.80L -> Tax ₹74,880)', () => {
    const r = calculateTax('2026-27', 'new', 'business', 'below60', {
      netProfitBeforeTax: 1_280_000,
    })
    expect(r.standardDeduction).toBe(0)
    expect(r.taxableIncome).toBe(1_280_000)
    // Base tax: 4L-8L (20k) + 8L-12L (40k) + 12L-12.8L (12k) = 72,000
    expect(r.taxBeforeRebate).toBe(72_000)
    // Excess income = 80,000 >= 72,000 -> relief ceases
    expect(r.rebate87A).toBe(0)
    expect(r.rebate87AMarginalReliefApplied).toBe(false)
    expect(r.cess).toBe(2880) // 4% of 72,000
    expect(r.totalTaxPayable).toBe(74_880)
  })

  it('TY26-27 F4: Old Regime Salaried Senior Citizen with 80C and 80D (Gross ₹9L -> Taxable ₹6.10L -> Tax ₹33,280)', () => {
    const r = calculateTax('2026-27', 'old', 'salary', '60to79', {
      grossSalary: 900_000,
      hasStandardDeduction: true,
      section80C: 150_000,
      section80D_self: 50_000,
      section80D_parents: 40_000,
      parentsSeniorCitizen: true,
    })
    expect(r.governingAct).toBe('Income-tax Act, 2025 (as amended by Finance Act 2026)')
    expect(r.standardDeduction).toBe(50_000)
    expect(r.section80C).toBe(150_000)
    expect(r.section80D).toBe(90_000)
    expect(r.taxableIncome).toBe(610_000)
    expect(r.taxBeforeRebate).toBe(32_000)
    expect(r.totalTaxPayable).toBe(33_280)
  })

  it('TY26-27 F5: Surcharge Marginal Relief at ₹50 Lakh boundary in New Regime (Net ₹51L -> Tax ₹12,27,200)', () => {
    const r = calculateTax('2026-27', 'new', 'business', 'below60', {
      netProfitBeforeTax: 5_100_000,
    })
    expect(r.taxableIncome).toBe(5_100_000)
    // Slabs: up to 24L (3L) + 27L @ 30% (8.1L) = 11,10,000
    expect(r.taxBeforeRebate).toBe(1_110_000)
    expect(r.surchargeMarginalReliefApplied).toBe(true)
    expect(r.surcharge).toBe(70_000)
    expect(r.cess).toBe(47_200)
    expect(r.totalTaxPayable).toBe(1_227_200)
  })

  it('TY26-27 F6: Distinguishes governing Acts between 2026–27 and historical years', () => {
    const r26 = calculateTax('2026-27', 'new', 'salary', 'below60', { grossSalary: 500_000, hasStandardDeduction: true })
    const r25 = calculateTax('2025-26', 'new', 'salary', 'below60', { grossSalary: 500_000, hasStandardDeduction: true })
    const r24 = calculateTax('2024-25', 'new', 'salary', 'below60', { grossSalary: 500_000, hasStandardDeduction: true })

    expect(r26.governingAct).toContain('Income-tax Act, 2025')
    expect(r25.governingAct).toContain('Income-tax Act, 1961')
    expect(r24.governingAct).toContain('Income-tax Act, 1961')
  })

  it('TY26-27 F7: Salary below standard deduction caps deduction at gross salary and yields 0 tax', () => {
    const r = calculateTax('2026-27', 'new', 'salary', 'below60', {
      grossSalary: 60_000,
      hasStandardDeduction: true,
    })
    expect(r.standardDeduction).toBe(60_000)
    expect(r.taxableIncome).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
  })

  it('TY26-27 F8: Negative profit yields zero taxable income with warning under 2025 Act', () => {
    const r = calculateTax('2026-27', 'new', 'business', 'below60', {
      netProfitBeforeTax: -50_000,
    })
    expect(r.taxableIncome).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
    expect(r.warnings.some(w => w.includes('Negative income'))).toBe(true)
  })

  it('TY26-27 F9: Section 80A(2) ceiling applies under Old Regime for TY 2026–27', () => {
    const r = calculateTax('2026-27', 'old', 'salary', 'below60', {
      grossSalary: 180_000,
      hasStandardDeduction: true,
      section80C: 150_000,
    })
    expect(r.standardDeduction).toBe(50_000)
    expect(r.totalDeductions).toBe(180_000) // 50k SD + 130k allowed 80C
    expect(r.taxableIncome).toBe(0)
    expect(r.totalTaxPayable).toBe(0)
    expect(r.warnings.some(w => w.includes('Section 80A(2)'))).toBe(true)
  })

  it('TY26-27 F10: Section 288A/B rounding of unrounded numbers in TY 2026–27', () => {
    const r = calculateTax('2026-27', 'new', 'business', 'below60', {
      netProfitBeforeTax: 1_234_567,
    })
    // 12,34,567 ends in 7 -> rounds up to 12,34,570
    expect(r.unroundedTaxableIncome).toBe(1_234_567)
    expect(r.taxableIncome).toBe(1_234_570)
    expect(r.totalTaxPayable % 10).toBe(0)
  })
})
