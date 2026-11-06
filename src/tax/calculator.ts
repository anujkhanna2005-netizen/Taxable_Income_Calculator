/**
 * Indian Income Tax Calculator Engine
 *
 * All amounts in whole rupees (integers). No floating point surprises in tax math.
 * Taxpayer Assumptions:
 *   - Status: Individual
 *   - Residential Status: Resident in India (Section 6, Income-tax Act, 1961)
 *
 * Statutory Rounding:
 *   - Taxable Income rounded to nearest multiple of ₹10 per Section 288A.
 *   - Tax Payable rounded to nearest multiple of ₹10 per Section 288B.
 */

import {
  type TaxYear,
  type Regime,
  type TaxSlab,
  type SurchargeSlab,
  type AgeSlabs,
  type SourceNote,
  FY_2024_25_NEW,
  FY_2024_25_OLD_SLABS,
  FY_2024_25_OLD_BASE,
  FY_2025_26_NEW,
  FY_2025_26_OLD_SLABS,
  FY_2025_26_OLD_BASE,
  TY_2026_27_NEW,
  TY_2026_27_OLD_SLABS,
  TY_2026_27_OLD_BASE,
  SECTION_80C_MAX,
  SECTION_80D_LIMIT_NORMAL,
  SECTION_80D_LIMIT_SENIOR,
  TAX_SOURCES,
} from './taxRules'

export type { TaxYear, Regime, SourceNote }
export type IncomeType = 'salary' | 'business'
export type AgeCategory = 'below60' | '60to79' | '80plus'

export interface SalaryInputs {
  grossSalary: number           // annual gross salary/pension in integer rupees
  hasStandardDeduction: boolean
  // Old regime only:
  section80C?: number           // 0 to 1,50,000 (PPF, ELSS, EPF, etc.)
  section80D_self?: number      // health insurance self+family
  section80D_parents?: number   // health insurance parents
  parentsSeniorCitizen?: boolean // are parents senior citizens (60+)?
}

export interface BusinessInputs {
  netProfitBeforeTax: number    // net taxable profit (Profit before Tax) in integer rupees
  // Old regime only:
  section80C?: number
  section80D_self?: number
  section80D_parents?: number
  parentsSeniorCitizen?: boolean
}

export interface BreakdownItem {
  label: string
  amount: number
  note?: string
}

export interface CalculationResult {
  taxYear: TaxYear
  regime: Regime
  incomeType: IncomeType
  ageCategory: AgeCategory
  financialYearLabel: string
  assessmentYearLabel: string
  governingAct: string
  residentIndividual: boolean

  // Taxable Income Components
  grossIncome: number
  standardDeduction: number
  section80C: number
  section80D: number
  totalDeductions: number
  unroundedTaxableIncome: number
  taxableIncome: number // Rounded to nearest ₹10 per Section 288A

  // Tax Payable Components
  taxBeforeRebate: number
  rebate87A: number
  rebate87AMarginalReliefApplied: boolean
  taxAfterRebate: number
  surcharge: number
  surchargeMarginalReliefApplied: boolean
  cess: number
  unroundedTaxPayable: number
  totalTaxPayable: number // Rounded to nearest ₹10 per Section 288B
  effectiveRate: number   // percentage, 2 decimal places on gross income

  // Breakdowns
  taxableIncomeBreakdown: BreakdownItem[]
  taxPayableBreakdown: BreakdownItem[]
  breakdown: BreakdownItem[]

  warnings: string[]
  assumptions: string[]
  sources: SourceNote[]
}

// ─── Statutory Rounding ───────────────────────────────────────────────────────

/**
 * Statutory rounding off as per Section 288A (Total Income) and Section 288B (Tax Payable):
 * Figures are rounded to the nearest multiple of ten rupees.
 * If the last digit of the rupee amount is 5 or more, it is rounded up; otherwise down.
 */
export function roundToNearestTen(amount: number): number {
  if (amount <= 0) return 0
  const integerPart = Math.floor(amount)
  const remainder = integerPart % 10
  if (remainder >= 5) {
    return integerPart + (10 - remainder)
  } else {
    return integerPart - remainder
  }
}

// ─── Slab Tax Math ────────────────────────────────────────────────────────────

/**
 * Apply progressive tax slabs to a taxable income using integer arithmetic.
 */
export function applySlabs(taxableIncome: number, slabs: TaxSlab[]): number {
  if (taxableIncome <= 0) return 0
  let tax = 0
  for (const slab of slabs) {
    if (taxableIncome <= slab.from - 1) break
    const slabTop = slab.to === Infinity ? taxableIncome : Math.min(taxableIncome, slab.to)
    const slabBottom = slab.from
    const slabIncome = slabTop - slabBottom + 1
    tax += Math.floor((slabIncome * slab.rate) / 100)
  }
  return tax
}

// ─── Section 87A Rebate & Marginal Relief ─────────────────────────────────────

export interface Rebate87AResult {
  rebate: number
  marginalReliefApplied: boolean
  marginalReliefAmount: number
}

/**
 * Calculates Section 87A rebate including statutory Marginal Relief under Section 115BAC proviso (b).
 *
 * Rules:
 * - Resident Individuals only.
 * - Old Regime: Eligible if total income <= ₹5,00,000. Max rebate ₹12,500. No marginal relief.
 * - New Regime:
 *   - FY 2024–25 (AY 2025–26): Threshold ₹7,00,000; normal max rebate ₹25,000.
 *   - FY 2025–26 (AY 2026–27): Threshold ₹12,00,000; normal max rebate ₹60,000.
 *   - Proviso (b) to Section 87A: If total income exceeds threshold, the rebate is the amount
 *     by which tax on total income exceeds (total income - threshold). This restricts tax after
 *     rebate to no more than the excess income above threshold!
 */
export function calculateRebate87A(
  taxableIncome: number,
  taxBeforeRebate: number,
  year: TaxYear,
  regime: Regime
): Rebate87AResult {
  if (taxableIncome <= 0 || taxBeforeRebate <= 0) {
    return { rebate: 0, marginalReliefApplied: false, marginalReliefAmount: 0 }
  }

  if (regime === 'old') {
    if (taxableIncome <= 500_000) {
      return {
        rebate: Math.min(taxBeforeRebate, 12_500),
        marginalReliefApplied: false,
        marginalReliefAmount: 0,
      }
    }
    return { rebate: 0, marginalReliefApplied: false, marginalReliefAmount: 0 }
  }

  // New Regime
  const threshold = year === '2024-25' ? 700_000 : 1_200_000
  const maxNormalRebate = year === '2024-25' ? 25_000 : 60_000

  if (taxableIncome <= threshold) {
    return {
      rebate: Math.min(taxBeforeRebate, maxNormalRebate),
      marginalReliefApplied: false,
      marginalReliefAmount: 0,
    }
  }

  // Marginal relief under Section 87A proviso (b):
  const excessIncome = taxableIncome - threshold
  if (taxBeforeRebate > excessIncome) {
    const marginalRebate = taxBeforeRebate - excessIncome
    return {
      rebate: marginalRebate,
      marginalReliefApplied: true,
      marginalReliefAmount: marginalRebate,
    }
  }

  return { rebate: 0, marginalReliefApplied: false, marginalReliefAmount: 0 }
}

// ─── Surcharge & Surcharge Marginal Relief ───────────────────────────────────

function getSurchargeRate(income: number, surchargeSlabs: SurchargeSlab[]): number {
  for (let i = surchargeSlabs.length - 1; i >= 0; i--) {
    if (income > surchargeSlabs[i].from) {
      return surchargeSlabs[i].rate
    }
  }
  return 0
}

function getSurchargeBracketBoundary(
  income: number,
  surchargeSlabs: SurchargeSlab[]
): { boundaryIncome: number; lowerRate: number } {
  for (let i = surchargeSlabs.length - 1; i >= 0; i--) {
    const slab = surchargeSlabs[i]
    if (income > slab.from && slab.rate > 0) {
      return { boundaryIncome: slab.from, lowerRate: surchargeSlabs[i - 1]?.rate ?? 0 }
    }
  }
  return { boundaryIncome: 0, lowerRate: 0 }
}

/**
 * Apply surcharge with marginal relief as per the First Schedule to the Finance Act.
 */
export function applySurchargeWithMarginalRelief(
  taxableIncome: number,
  baseTax: number,
  surchargeSlabs: SurchargeSlab[],
  taxSlabs: TaxSlab[]
): { surcharge: number; marginalReliefApplied: boolean; marginalReliefAmount: number } {
  const surchargeRate = getSurchargeRate(taxableIncome, surchargeSlabs)
  if (surchargeRate === 0 || baseTax <= 0) {
    return { surcharge: 0, marginalReliefApplied: false, marginalReliefAmount: 0 }
  }

  const rawSurcharge = Math.floor((baseTax * surchargeRate) / 100)
  const { boundaryIncome } = getSurchargeBracketBoundary(taxableIncome, surchargeSlabs)
  if (boundaryIncome === 0) {
    return { surcharge: rawSurcharge, marginalReliefApplied: false, marginalReliefAmount: 0 }
  }

  const taxAtBoundary = applySlabs(boundaryIncome, taxSlabs)
  const surchargeRateAtBoundary = getSurchargeRate(boundaryIncome, surchargeSlabs)
  const surchargeAtBoundary = Math.floor((taxAtBoundary * surchargeRateAtBoundary) / 100)
  const totalTaxAtBoundary = taxAtBoundary + surchargeAtBoundary

  const totalTaxAtActual = baseTax + rawSurcharge
  const netIncomeAtBoundary = boundaryIncome - totalTaxAtBoundary
  const netIncomeAtActual = taxableIncome - totalTaxAtActual

  if (netIncomeAtActual < netIncomeAtBoundary) {
    const marginalReliefAmount = netIncomeAtBoundary - netIncomeAtActual
    const adjustedSurcharge = Math.max(0, rawSurcharge - marginalReliefAmount)
    return { surcharge: adjustedSurcharge, marginalReliefApplied: true, marginalReliefAmount }
  }

  return { surcharge: rawSurcharge, marginalReliefApplied: false, marginalReliefAmount: 0 }
}

// ─── Old Regime Helpers ───────────────────────────────────────────────────────

function getOldRegimeSlabs(ageCategory: AgeCategory, ageSlabs: AgeSlabs): TaxSlab[] {
  switch (ageCategory) {
    case 'below60':  return ageSlabs.below60
    case '60to79':   return ageSlabs.sixtyTo79
    case '80plus':   return ageSlabs.eightyPlus
  }
}

function getOldRegimeBasicExemption(ageCategory: AgeCategory, ageSlabs: AgeSlabs): number {
  switch (ageCategory) {
    case 'below60':  return ageSlabs.basicExemptionBelow60
    case '60to79':   return ageSlabs.basicExemptionSixtyTo79
    case '80plus':   return ageSlabs.basicExemptionEightyPlus
  }
}

/**
 * Section 80D limits:
 * - Self & Family: ₹25,000 (or ₹50,000 if taxpayer is senior citizen, i.e. 60+)
 * - Parents: ₹25,000 (or ₹50,000 if parents are senior citizens, 60+)
 */
function calc80D(
  section80D_self: number | undefined,
  section80D_parents: number | undefined,
  ageCategory: AgeCategory,
  parentsSeniorCitizen: boolean | undefined
): number {
  const isTaxpayerSenior = ageCategory !== 'below60'
  const selfLimit = isTaxpayerSenior ? SECTION_80D_LIMIT_SENIOR : SECTION_80D_LIMIT_NORMAL
  const parentsLimit = parentsSeniorCitizen ? SECTION_80D_LIMIT_SENIOR : SECTION_80D_LIMIT_NORMAL
  const selfDeduction = Math.min(Math.max(0, section80D_self ?? 0), selfLimit)
  const parentsDeduction = Math.min(Math.max(0, section80D_parents ?? 0), parentsLimit)
  return selfDeduction + parentsDeduction
}

// ─── Main Calculation Engine ──────────────────────────────────────────────────

export function calculateTax(
  year: TaxYear,
  regime: Regime,
  incomeType: IncomeType,
  ageCategory: AgeCategory,
  inputs: SalaryInputs | BusinessInputs
): CalculationResult {
  const warnings: string[] = []
  const assumptions: string[] = []
  const taxableIncomeBreakdown: BreakdownItem[] = []
  const taxPayableBreakdown: BreakdownItem[] = []

  // Validate supported year
  if (year !== '2024-25' && year !== '2025-26' && year !== '2026-27') {
    throw new Error(`Unsupported tax year: ${year}. Supported years: '2024-25', '2025-26', and '2026-27'.`)
  }

  const governingAct =
    year === '2026-27'
      ? 'Income-tax Act, 2025 (as amended by Finance Act 2026)'
      : year === '2025-26'
      ? 'Income-tax Act, 1961 (as amended by Finance Act, 2025)'
      : 'Income-tax Act, 1961 (as amended by Finance (No. 2) Act, 2024)'

  const financialYearLabel =
    year === '2024-25'
      ? 'FY 2024–25 (1 Apr 2024 – 31 Mar 2025)'
      : year === '2025-26'
      ? 'FY 2025–26 (1 Apr 2025 – 31 Mar 2026)'
      : 'Tax Year 2026–27 (1 Apr 2026 – 31 Mar 2027)'

  const assessmentYearLabel =
    year === '2024-25'
      ? 'AY 2025–26'
      : year === '2025-26'
      ? 'AY 2026–27'
      : 'AY 2027–28'

  assumptions.push('Taxpayer Status: Individual.')
  assumptions.push('Residential Status: Resident in India for tax purposes. Non-Residents (NRIs) are not supported.')
  assumptions.push(`Applicable Period: ${financialYearLabel} | Assessment Year: ${assessmentYearLabel}.`)
  assumptions.push(`Governing Statutory Framework: ${governingAct}.`)

  // Extract gross income
  const rawGrossIncome =
    incomeType === 'salary'
      ? (inputs as SalaryInputs).grossSalary
      : (inputs as BusinessInputs).netProfitBeforeTax

  if (typeof rawGrossIncome !== 'number' || !isFinite(rawGrossIncome)) {
    throw new Error('Income must be a valid finite number.')
  }

  if (rawGrossIncome < 0) {
    warnings.push('Negative income entered. Taxable income and tax payable are zero.')
    return buildZeroResult(year, regime, incomeType, ageCategory, 0, warnings, assumptions)
  }

  const grossIncome = Math.floor(rawGrossIncome)

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 1: CALCULATE TAXABLE INCOME (NO SLABS OR REBATES USED HERE)
  // ══════════════════════════════════════════════════════════════════════════════

  taxableIncomeBreakdown.push({
    label: incomeType === 'salary' ? 'Gross Annual Salary / Pension Income' : 'Net Taxable Business Profit',
    amount: grossIncome,
    note: incomeType === 'salary' ? 'As per Form 16 before deductions' : 'Profit before tax',
  })

  let standardDeduction = 0
  let section80C = 0
  let section80D = 0
  let totalVI_ADeductions = 0

  if (incomeType === 'salary') {
    const sdLimit = regime === 'new'
      ? (year === '2024-25'
          ? FY_2024_25_NEW.standardDeductionSalary
          : year === '2025-26'
          ? FY_2025_26_NEW.standardDeductionSalary
          : TY_2026_27_NEW.standardDeductionSalary)
      : FY_2024_25_OLD_BASE.standardDeductionSalary

    // Standard deduction cannot exceed actual gross salary
    standardDeduction = Math.min(grossIncome, sdLimit)
    if (standardDeduction > 0) {
      taxableIncomeBreakdown.push({
        label: 'Less: Standard Deduction',
        amount: -standardDeduction,
        note: `Standard deduction — max ₹${sdLimit.toLocaleString('en-IN')}`,
      })
      assumptions.push(`Standard deduction of ₹${standardDeduction.toLocaleString('en-IN')} applied.`)
    }
  } else {
    assumptions.push('Standard deduction is strictly for salary/pension income and is NOT available for business or profession.')
  }

  const grossTotalIncome = Math.max(0, grossIncome - standardDeduction)

  if (regime === 'old') {
    // Chapter VI-A deductions (Old Regime only - strictly verified 80C and 80D)
    const raw80C = Math.max(0, inputs.section80C ?? 0)
    section80C = Math.min(raw80C, SECTION_80C_MAX)
    if (raw80C > SECTION_80C_MAX) {
      warnings.push(`Section 80C deduction is capped at statutory limit of ₹1,50,000 (you entered ₹${raw80C.toLocaleString('en-IN')}).`)
    }

    const raw80D_self = Math.max(0, inputs.section80D_self ?? 0)
    const raw80D_parents = Math.max(0, inputs.section80D_parents ?? 0)
    const isTaxpayerSenior = ageCategory !== 'below60'
    const selfLimit = isTaxpayerSenior ? SECTION_80D_LIMIT_SENIOR : SECTION_80D_LIMIT_NORMAL
    const parentsLimit = inputs.parentsSeniorCitizen ? SECTION_80D_LIMIT_SENIOR : SECTION_80D_LIMIT_NORMAL

    if (raw80D_self > selfLimit) {
      warnings.push(
        `Section 80D health insurance deduction for self & family is capped at statutory limit of ₹${selfLimit.toLocaleString('en-IN')} (you entered ₹${raw80D_self.toLocaleString('en-IN')}).`
      )
    }
    if (raw80D_parents > parentsLimit) {
      warnings.push(
        `Section 80D health insurance deduction for parents is capped at statutory limit of ₹${parentsLimit.toLocaleString('en-IN')} (you entered ₹${raw80D_parents.toLocaleString('en-IN')}).`
      )
    }

    section80D = calc80D(
      inputs.section80D_self,
      inputs.section80D_parents,
      ageCategory,
      inputs.parentsSeniorCitizen
    )

    const totalClaimedVI_A = section80C + section80D

    // Under Section 80A(2), aggregate deductions under Chapter VI-A cannot exceed Gross Total Income
    const allowedVI_A = Math.min(grossTotalIncome, totalClaimedVI_A)
    if (totalClaimedVI_A > grossTotalIncome && grossTotalIncome > 0) {
      warnings.push(
        `Under Section 80A(2), Chapter VI-A deductions cannot exceed Gross Total Income (capped at ₹${grossTotalIncome.toLocaleString('en-IN')}).`
      )
    }

    if (section80C > 0) {
      taxableIncomeBreakdown.push({
        label: 'Less: Section 80C Deductions',
        amount: -section80C,
        note: 'Max ₹1,50,000 (PPF, ELSS, EPF, LIC, etc.)',
      })
    }
    if (section80D > 0) {
      const isSenior = ageCategory !== 'below60'
      const selfLimit = isSenior ? '₹50,000 (senior)' : '₹25,000'
      const parLimit = inputs.parentsSeniorCitizen ? '₹50,000 (senior)' : '₹25,000'
      taxableIncomeBreakdown.push({
        label: 'Less: Section 80D Health Insurance',
        amount: -section80D,
        note: `Self cap: ${selfLimit}; Parents cap: ${parLimit}`,
      })
    }

    totalVI_ADeductions = allowedVI_A
    assumptions.push('Only verified deductions under Section 80C and Section 80D are computed. Other Chapter VI-A deductions (80CCD, 80E, 80G, etc.) are outside the scope.')
  } else {
    assumptions.push('Chapter VI-A deductions (80C, 80D) and HRA/LTA exemptions are not allowable under the New Tax Regime (Section 115BAC).')
  }

  const totalDeductionsClaimed = standardDeduction + totalVI_ADeductions
  const unroundedTaxableIncome = Math.max(0, grossIncome - totalDeductionsClaimed)

  // Section 288A: Round taxable income to nearest multiple of ₹10
  const taxableIncome = roundToNearestTen(unroundedTaxableIncome)

  taxableIncomeBreakdown.push({
    label: 'Estimated Taxable Income',
    amount: taxableIncome,
    note: taxableIncome !== unroundedTaxableIncome
      ? 'Rounded to nearest ₹10 per Section 288A'
      : 'Section 288A rounded',
  })

  assumptions.push('Statutory rounding: Taxable Income rounded to nearest multiple of ₹10 as per Section 288A.')

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 2: CALCULATE ESTIMATED TAX PAYABLE (SEPARATE STEP)
  // ══════════════════════════════════════════════════════════════════════════════

  let taxSlabs: TaxSlab[]
  let surchargeSlabs: SurchargeSlab[]
  let cessRate = 4

  if (regime === 'new') {
    const rules =
      year === '2024-25'
        ? FY_2024_25_NEW
        : year === '2025-26'
        ? FY_2025_26_NEW
        : TY_2026_27_NEW
    taxSlabs = rules.slabs
    surchargeSlabs = rules.surchargeSlabs
    cessRate = rules.cess
    assumptions.push(
      year === '2026-27'
        ? 'New Tax Regime slab rates under Income-tax Act, 2025 are uniform across all age categories.'
        : 'New Tax Regime slab rates under Section 115BAC are uniform across all age categories.'
    )
  } else {
    const ageSlabs =
      year === '2024-25'
        ? FY_2024_25_OLD_SLABS
        : year === '2025-26'
        ? FY_2025_26_OLD_SLABS
        : TY_2026_27_OLD_SLABS
    const baseRules =
      year === '2024-25'
        ? FY_2024_25_OLD_BASE
        : year === '2025-26'
        ? FY_2025_26_OLD_BASE
        : TY_2026_27_OLD_BASE
    taxSlabs = getOldRegimeSlabs(ageCategory, ageSlabs)
    surchargeSlabs = baseRules.surchargeSlabs
    cessRate = baseRules.cess

    const basicExemption = getOldRegimeBasicExemption(ageCategory, ageSlabs)
    const ageDesc = ageCategory === 'below60'
      ? 'Individual below 60 years'
      : ageCategory === '60to79'
      ? 'Senior Citizen (60 to 79 years)'
      : 'Super Senior Citizen (80+ years)'
    assumptions.push(`Old Regime slab rates applied for: ${ageDesc} (Basic Exemption: ₹${basicExemption.toLocaleString('en-IN')}).`)
  }

  // 1. Slab tax
  const taxBeforeRebate = applySlabs(taxableIncome, taxSlabs)
  taxPayableBreakdown.push({
    label: 'Income Tax on Taxable Income (as per slabs)',
    amount: taxBeforeRebate,
  })

  // 2. Section 87A rebate & marginal relief
  const rebateResult = calculateRebate87A(taxableIncome, taxBeforeRebate, year, regime)
  const rebate87A = rebateResult.rebate

  if (rebate87A > 0) {
    taxPayableBreakdown.push({
      label: 'Less: Tax Rebate u/s 87A',
      amount: -rebate87A,
      note: rebateResult.marginalReliefApplied
        ? 'Includes statutory marginal relief under Section 87A proviso (b)'
        : 'Resident Individual rebate',
    })
    if (rebateResult.marginalReliefApplied) {
      warnings.push(
        `Statutory marginal relief of ₹${rebateResult.marginalReliefAmount.toLocaleString('en-IN')} applied under proviso (b) to Section 87A, capping tax at the excess income over the threshold.`
      )
    }
  }

  const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87A)

  // 3. Surcharge & surcharge marginal relief
  const surchargeResult = applySurchargeWithMarginalRelief(
    taxableIncome,
    taxAfterRebate,
    surchargeSlabs,
    taxSlabs
  )
  const surcharge = surchargeResult.surcharge

  if (surcharge > 0) {
    const rate = getSurchargeRate(taxableIncome, surchargeSlabs)
    taxPayableBreakdown.push({
      label: `Add: Surcharge (${rate}%)`,
      amount: surcharge,
      note: surchargeResult.marginalReliefApplied
        ? `Marginal relief of ₹${surchargeResult.marginalReliefAmount.toLocaleString('en-IN')} applied`
        : undefined,
    })
    if (surchargeResult.marginalReliefApplied) {
      warnings.push(
        `Surcharge marginal relief of ₹${surchargeResult.marginalReliefAmount.toLocaleString('en-IN')} applied to prevent tax increase from exceeding incremental income.`
      )
    }
  }

  // 4. Health & Education Cess (4%)
  const taxPlusSurcharge = taxAfterRebate + surcharge
  const cess = taxPlusSurcharge > 0 ? Math.round((taxPlusSurcharge * cessRate) / 100) : 0

  if (cess > 0) {
    taxPayableBreakdown.push({
      label: `Add: Health & Education Cess (${cessRate}%)`,
      amount: cess,
      note: '4% on (Income Tax + Surcharge)',
    })
  }

  // 5. Total Tax Payable & Section 288B Rounding
  const unroundedTaxPayable = taxPlusSurcharge + cess
  const totalTaxPayable = roundToNearestTen(unroundedTaxPayable)

  taxPayableBreakdown.push({
    label: 'Estimated Total Tax Payable',
    amount: totalTaxPayable,
    note: totalTaxPayable !== unroundedTaxPayable
      ? 'Rounded to nearest ₹10 per Section 288B'
      : 'Section 288B rounded',
  })

  assumptions.push('Statutory rounding: Tax Payable rounded to nearest multiple of ₹10 as per Section 288B.')

  // Effective tax rate on gross income
  const effectiveRate = grossIncome > 0
    ? Math.round((totalTaxPayable / grossIncome) * 10000) / 100
    : 0

  // Combined breakdown
  const combinedBreakdown: BreakdownItem[] = [
    ...taxableIncomeBreakdown,
    ...taxPayableBreakdown,
  ]

  return {
    taxYear: year,
    regime,
    incomeType,
    ageCategory,
    financialYearLabel,
    assessmentYearLabel,
    governingAct,
    residentIndividual: true,
    grossIncome,
    standardDeduction,
    section80C,
    section80D,
    totalDeductions: totalDeductionsClaimed,
    unroundedTaxableIncome,
    taxableIncome,
    taxBeforeRebate,
    rebate87A,
    rebate87AMarginalReliefApplied: rebateResult.marginalReliefApplied,
    taxAfterRebate,
    surcharge,
    surchargeMarginalReliefApplied: surchargeResult.marginalReliefApplied,
    cess,
    unroundedTaxPayable,
    totalTaxPayable,
    effectiveRate,
    taxableIncomeBreakdown,
    taxPayableBreakdown,
    breakdown: combinedBreakdown,
    warnings,
    assumptions,
    sources: TAX_SOURCES,
  }
}

// ─── Zero / Negative Result Builder ──────────────────────────────────────────

function buildZeroResult(
  year: TaxYear,
  regime: Regime,
  incomeType: IncomeType,
  ageCategory: AgeCategory,
  grossIncome: number,
  warnings: string[],
  assumptions: string[]
): CalculationResult {
  const governingAct =
    year === '2026-27'
      ? 'Income-tax Act, 2025 (as amended by Finance Act 2026)'
      : year === '2025-26'
      ? 'Income-tax Act, 1961 (as amended by Finance Act, 2025)'
      : 'Income-tax Act, 1961 (as amended by Finance (No. 2) Act, 2024)'

  const financialYearLabel =
    year === '2024-25'
      ? 'FY 2024–25 (1 Apr 2024 – 31 Mar 2025)'
      : year === '2025-26'
      ? 'FY 2025–26 (1 Apr 2025 – 31 Mar 2026)'
      : 'Tax Year 2026–27 (1 Apr 2026 – 31 Mar 2027)'

  const assessmentYearLabel =
    year === '2024-25'
      ? 'AY 2025–26'
      : year === '2025-26'
      ? 'AY 2026–27'
      : 'AY 2027–28'

  const taxableIncomeBreakdown: BreakdownItem[] = [
    { label: 'Gross Income', amount: grossIncome },
    { label: 'Estimated Taxable Income', amount: 0, note: 'Section 288A rounded' },
  ]
  const taxPayableBreakdown: BreakdownItem[] = [
    { label: 'Estimated Total Tax Payable', amount: 0, note: 'Section 288B rounded' },
  ]

  return {
    taxYear: year,
    regime,
    incomeType,
    ageCategory,
    financialYearLabel,
    assessmentYearLabel,
    governingAct,
    residentIndividual: true,
    grossIncome,
    standardDeduction: 0,
    section80C: 0,
    section80D: 0,
    totalDeductions: 0,
    unroundedTaxableIncome: 0,
    taxableIncome: 0,
    taxBeforeRebate: 0,
    rebate87A: 0,
    rebate87AMarginalReliefApplied: false,
    taxAfterRebate: 0,
    surcharge: 0,
    surchargeMarginalReliefApplied: false,
    cess: 0,
    unroundedTaxPayable: 0,
    totalTaxPayable: 0,
    effectiveRate: 0,
    taxableIncomeBreakdown,
    taxPayableBreakdown,
    breakdown: [...taxableIncomeBreakdown, ...taxPayableBreakdown],
    warnings,
    assumptions,
    sources: TAX_SOURCES,
  }
}
