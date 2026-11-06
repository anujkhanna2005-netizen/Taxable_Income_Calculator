/**
 * Tax Rules Data File
 * All amounts in whole rupees (integers). No floating point in tax math.
 *
 * Taxpayer Scope:
 *   - Status: Individual
 *   - Residential Status: Resident in India
 *
 * Tax Years & Governing Acts Supported:
 *   - Tax Year 2026–27 (AY 2027–28) under the Income-tax Act, 2025 (as amended by Finance Act 2026)
 *   - FY 2025–26 (AY 2026–27) under the Income-tax Act, 1961 (as amended by Finance Act, 2025)
 *   - FY 2024–25 (AY 2025–26) under the Income-tax Act, 1961 (as amended by Finance (No. 2) Act, 2024)
 *
 * Sources:
 *   - Income-tax Act, 2025 / Finance Act 2026
 *   - Income-tax Act, 1961 / Finance Acts 2024 & 2025
 *   - Income Tax Department Portal: https://incometaxindia.gov.in
 */

export type TaxYear = '2024-25' | '2025-26' | '2026-27'
export type Regime = 'new' | 'old'

export interface TaxSlab {
  from: number  // inclusive, rupees
  to: number    // inclusive, rupees (use Infinity for top bracket)
  rate: number  // percentage as integer e.g. 5 = 5%
}

export interface SurchargeSlab {
  from: number       // income > from
  to: number         // income <= to (use Infinity for top)
  rate: number       // percentage
}

export interface RegimeRules {
  financialYear: string
  assessmentYear: string
  governingAct: string
  basicExemption: number            // rupees
  slabs: TaxSlab[]
  standardDeductionSalary: number   // rupees (salary/pension only)
  rebate87ALimit: number            // max standard rebate amount in rupees
  rebate87AIncomeLimit: number      // normal eligibility threshold (taxable income <= this)
  rebate87AHouseMarginalRelief: boolean // Section 87A / Section 156 marginal relief applies
  surchargeSlabs: SurchargeSlab[]
  maxSurchargeRate: number          // cap on surcharge rate (%)
  cess: number                      // percentage (4% Health & Education Cess)
}

export interface AgeSlabs {
  below60: TaxSlab[]
  sixtyTo79: TaxSlab[]
  eightyPlus: TaxSlab[]
  basicExemptionBelow60: number
  basicExemptionSixtyTo79: number
  basicExemptionEightyPlus: number
}

/** Surcharge brackets for Old Regime (up to 37%) */
export const OLD_REGIME_SURCHARGE_SLABS: SurchargeSlab[] = [
  { from: 0,           to: 5_000_000,   rate: 0  },
  { from: 5_000_000,   to: 10_000_000,  rate: 10 },
  { from: 10_000_000,  to: 20_000_000,  rate: 15 },
  { from: 20_000_000,  to: 50_000_000,  rate: 25 },
  { from: 50_000_000,  to: Infinity,    rate: 37 },
]

/** Surcharge brackets for New Regime (capped at 25% under Section 115BAC) */
export const NEW_REGIME_SURCHARGE_SLABS: SurchargeSlab[] = [
  { from: 0,           to: 5_000_000,   rate: 0  },
  { from: 5_000_000,   to: 10_000_000,  rate: 10 },
  { from: 10_000_000,  to: 20_000_000,  rate: 15 },
  { from: 20_000_000,  to: Infinity,    rate: 25 }, // capped at 25% under Section 115BAC(1A)
]

// ─── FY 2024–25 (AY 2025–26) — Income-tax Act, 1961 ──────────────────────────

export const FY_2024_25_NEW: RegimeRules = {
  financialYear: 'FY 2024–25 (1 Apr 2024 – 31 Mar 2025)',
  assessmentYear: 'AY 2025–26',
  governingAct: 'Income-tax Act, 1961 (as amended by Finance (No. 2) Act, 2024)',
  basicExemption: 300_000,
  slabs: [
    { from: 0,         to: 300_000,   rate: 0  },
    { from: 300_001,   to: 700_000,   rate: 5  },
    { from: 700_001,   to: 1_000_000, rate: 10 },
    { from: 1_000_001, to: 1_200_000, rate: 15 },
    { from: 1_200_001, to: 1_500_000, rate: 20 },
    { from: 1_500_001, to: Infinity,  rate: 30 },
  ],
  standardDeductionSalary: 75_000, // Enhanced to ₹75,000 by Finance (No. 2) Act, 2024
  rebate87ALimit: 25_000,
  rebate87AIncomeLimit: 700_000,
  rebate87AHouseMarginalRelief: true, // Proviso (b) to Section 87A
  surchargeSlabs: NEW_REGIME_SURCHARGE_SLABS,
  maxSurchargeRate: 25,
  cess: 4,
}

/** Old Regime slabs by age for FY 2024–25 (AY 2025–26) */
export const FY_2024_25_OLD_SLABS: AgeSlabs = {
  basicExemptionBelow60: 250_000,
  below60: [
    { from: 0,         to: 250_000,   rate: 0  },
    { from: 250_001,   to: 500_000,   rate: 5  },
    { from: 500_001,   to: 1_000_000, rate: 20 },
    { from: 1_000_001, to: Infinity,  rate: 30 },
  ],
  basicExemptionSixtyTo79: 300_000,
  sixtyTo79: [
    { from: 0,         to: 300_000,   rate: 0  },
    { from: 300_001,   to: 500_000,   rate: 5  },
    { from: 500_001,   to: 1_000_000, rate: 20 },
    { from: 1_000_001, to: Infinity,  rate: 30 },
  ],
  basicExemptionEightyPlus: 500_000,
  eightyPlus: [
    { from: 0,         to: 500_000,   rate: 0  },
    { from: 500_001,   to: 1_000_000, rate: 20 },
    { from: 1_000_001, to: Infinity,  rate: 30 },
  ],
}

export const FY_2024_25_OLD_BASE: Omit<RegimeRules, 'slabs' | 'basicExemption'> = {
  financialYear: 'FY 2024–25 (1 Apr 2024 – 31 Mar 2025)',
  assessmentYear: 'AY 2025–26',
  governingAct: 'Income-tax Act, 1961 (Historical)',
  standardDeductionSalary: 50_000, // ₹50,000 under Section 16(ia) in Old Regime
  rebate87ALimit: 12_500,
  rebate87AIncomeLimit: 500_000,
  rebate87AHouseMarginalRelief: false, // Old regime has no 87A marginal relief
  surchargeSlabs: OLD_REGIME_SURCHARGE_SLABS,
  maxSurchargeRate: 37,
  cess: 4,
}

// ─── FY 2025–26 (AY 2026–27) — Income-tax Act, 1961 ──────────────────────────

export const FY_2025_26_NEW: RegimeRules = {
  financialYear: 'FY 2025–26 (1 Apr 2025 – 31 Mar 2026)',
  assessmentYear: 'AY 2026–27',
  governingAct: 'Income-tax Act, 1961 (as amended by Finance Act, 2025)',
  basicExemption: 400_000,
  slabs: [
    { from: 0,         to: 400_000,   rate: 0  },
    { from: 400_001,   to: 800_000,   rate: 5  },
    { from: 800_001,   to: 1_200_000, rate: 10 },
    { from: 1_200_001, to: 1_600_000, rate: 15 },
    { from: 1_600_001, to: 2_000_000, rate: 20 },
    { from: 2_000_001, to: 2_400_000, rate: 25 },
    { from: 2_400_001, to: Infinity,  rate: 30 },
  ],
  standardDeductionSalary: 75_000,
  rebate87ALimit: 60_000,
  rebate87AIncomeLimit: 1_200_000,
  rebate87AHouseMarginalRelief: true, // Proviso (b) to Section 87A
  surchargeSlabs: NEW_REGIME_SURCHARGE_SLABS,
  maxSurchargeRate: 25,
  cess: 4,
}

/** Old Regime for FY 2025–26 (AY 2026–27) */
export const FY_2025_26_OLD_SLABS: AgeSlabs = FY_2024_25_OLD_SLABS
export const FY_2025_26_OLD_BASE: Omit<RegimeRules, 'slabs' | 'basicExemption'> = {
  ...FY_2024_25_OLD_BASE,
  financialYear: 'FY 2025–26 (1 Apr 2025 – 31 Mar 2026)',
  assessmentYear: 'AY 2026–27',
  governingAct: 'Income-tax Act, 1961 (as amended by Finance Act, 2025)',
}

// ─── Tax Year 2026–27 (AY 2027–28) — Income-tax Act, 2025 ────────────────────

export const TY_2026_27_NEW: RegimeRules = {
  financialYear: 'Tax Year 2026–27 (1 Apr 2026 – 31 Mar 2027)',
  assessmentYear: 'AY 2027–28',
  governingAct: 'Income-tax Act, 2025 (as amended by Finance Act 2026)',
  basicExemption: 400_000,
  slabs: [
    { from: 0,         to: 400_000,   rate: 0  },
    { from: 400_001,   to: 800_000,   rate: 5  },
    { from: 800_001,   to: 1_200_000, rate: 10 },
    { from: 1_200_001, to: 1_600_000, rate: 15 },
    { from: 1_600_001, to: 2_000_000, rate: 20 },
    { from: 2_000_001, to: 2_400_000, rate: 25 },
    { from: 2_400_001, to: Infinity,  rate: 30 },
  ],
  standardDeductionSalary: 75_000,
  rebate87ALimit: 60_000,
  rebate87AIncomeLimit: 1_200_000,
  rebate87AHouseMarginalRelief: true, // Proviso to Section 156 / 87A
  surchargeSlabs: NEW_REGIME_SURCHARGE_SLABS,
  maxSurchargeRate: 25,
  cess: 4,
}

/** Old Regime under Income-tax Act, 2025 */
export const TY_2026_27_OLD_SLABS: AgeSlabs = FY_2024_25_OLD_SLABS
export const TY_2026_27_OLD_BASE: Omit<RegimeRules, 'slabs' | 'basicExemption'> = {
  ...FY_2024_25_OLD_BASE,
  financialYear: 'Tax Year 2026–27 (1 Apr 2026 – 31 Mar 2027)',
  assessmentYear: 'AY 2027–28',
  governingAct: 'Income-tax Act, 2025 (Optional Old Regime)',
}

// ─── Supported Chapter VI-A Deductions (Old Regime Only) ──────────────────────

/** Section 80C maximum deduction limit (Rupees) */
export const SECTION_80C_MAX = 150_000

/** Section 80D limits (Rupees, Old Regime Only) */
export const SECTION_80D_LIMIT_NORMAL = 25_000
export const SECTION_80D_LIMIT_SENIOR = 50_000

// ─── Source Notes ─────────────────────────────────────────────────────────────

export interface SourceNote {
  rule: string
  section: string
  applicableYear: string
  source: string
  url: string
}

export const TAX_SOURCES: SourceNote[] = [
  {
    rule: 'Tax Year 2026–27 New Regime Slabs & Thresholds',
    section: 'Income-tax Act, 2025 (Section 154 as amended by Finance Act 2026)',
    applicableYear: 'Tax Year 2026–27 (AY 2027–28)',
    source: 'Income-tax Act, 2025 / Finance Act 2026',
    url: 'https://incometaxindia.gov.in',
  },
  {
    rule: 'Tax Year 2026–27 Tax Rebate & Marginal Relief (New Regime)',
    section: 'Income-tax Act, 2025 (Section 156 / erstwhile Sec 87A)',
    applicableYear: 'Tax Year 2026–27 (AY 2027–28)',
    source: 'Income-tax Act, 2025 (Full rebate up to ₹12L; Proviso marginal relief)',
    url: 'https://incometaxindia.gov.in',
  },
  {
    rule: 'Tax Year 2026–27 Standard Deduction (Salary/Pension)',
    section: 'Income-tax Act, 2025',
    applicableYear: 'Tax Year 2026–27 (AY 2027–28)',
    source: 'Income-tax Act, 2025 (₹75k New / ₹50k Old)',
    url: 'https://incometaxindia.gov.in',
  },
  {
    rule: 'New Tax Regime Slabs (FY 2024–25 / AY 2025–26)',
    section: 'Section 115BAC(1A)',
    applicableYear: 'FY 2024–25 (AY 2025–26)',
    source: 'Finance (No. 2) Act, 2024',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'New Tax Regime Slabs (FY 2025–26 / AY 2026–27)',
    section: 'Section 115BAC(1A)',
    applicableYear: 'FY 2025–26 (AY 2026–27)',
    source: 'Finance Act, 2025 / Union Budget 2025 (PIB)',
    url: 'https://pib.gov.in',
  },
  {
    rule: 'Old Tax Regime Slabs (Below 60, Senior 60–79, Super Senior 80+)',
    section: 'First Schedule, Part I to the Annual Finance Act read with Section 2(14)',
    applicableYear: 'FY 2024–25 & FY 2025–26',
    source: 'Income-tax Act, 1961',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Standard Deduction for Salaried Individuals & Pensioners',
    section: 'Section 16(ia) read with Section 115BAC(1A)',
    applicableYear: 'FY 2024–25 & FY 2025–26',
    source: 'Finance (No. 2) Act, 2024 (₹75k New / ₹50k Old)',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Section 87A Rebate & Proviso (b) Marginal Relief (New Regime)',
    section: 'Section 87A & Proviso to Section 87A',
    applicableYear: 'FY 2024–25 (up to ₹7L) & FY 2025–26 (up to ₹12L)',
    source: 'Finance Act, 2023 / Finance (No. 2) Act, 2024 / Finance Act, 2025',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Section 87A Rebate (Old Regime, up to ₹5L)',
    section: 'Section 87A',
    applicableYear: 'FY 2024–25 & FY 2025–26',
    source: 'Income-tax Act, 1961 (Max ₹12,500; no marginal relief)',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Surcharge & Surcharge Marginal Relief',
    section: 'First Schedule, Part I to the Finance Act read with Section 115BAC',
    applicableYear: 'FY 2024–25 & FY 2025–26',
    source: 'Finance Act provisions (Max 25% New / Max 37% Old)',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Health & Education Cess (4%)',
    section: 'Section 2(12A) of the Annual Finance Act',
    applicableYear: 'FY 2024–25 & FY 2025–26',
    source: 'Finance Act, 2018 (Section 2(12A))',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Statutory Rounding off of Taxable Income',
    section: 'Section 288A',
    applicableYear: 'All Assessment Years',
    source: 'Income-tax Act, 1961 (Rounded to nearest multiple of ₹10)',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Statutory Rounding off of Tax Payable',
    section: 'Section 288B',
    applicableYear: 'All Assessment Years',
    source: 'Income-tax Act, 1961 (Rounded to nearest multiple of ₹10)',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Section 80C Deduction (Old Regime Only)',
    section: 'Section 80C',
    applicableYear: 'FY 2024–25 & FY 2025–26',
    source: 'Income-tax Act, 1961 (Max ₹1,50,000)',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Section 80D Health Insurance Deduction (Old Regime Only)',
    section: 'Section 80D',
    applicableYear: 'FY 2024–25 & FY 2025–26',
    source: 'Income-tax Act, 1961 (Self & Family ₹25k/₹50k; Parents ₹25k/₹50k)',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
  {
    rule: 'Chapter VI-A Deductions Capped at Gross Total Income',
    section: 'Section 80A(2)',
    applicableYear: 'All Assessment Years',
    source: 'Income-tax Act, 1961',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
  },
]
