# Indian Income Tax Rules & Calculation Specification

This document records every tax rule, deduction, threshold, rebate, surcharge, cess, and rounding provision implemented in the calculator. All rules are verified against official Government of India sources (Income-tax Act, 1961, Finance Acts, and the Income Tax Department portal at [incometaxindia.gov.in](https://incometaxindia.gov.in)).

---

## 1. Scope & Taxpayer Profile Assumptions

The calculator is strictly parameterized for:
1. **Taxpayer Status:** Individual (not HUFs, AOPs, BOIs, Firms, LLPs, or Companies).
2. **Residential Status:** **Resident in India** under Section 6 of the Income-tax Act, 1961. Non-Residents (NRIs) and Resident but Not Ordinarily Resident (RNOR) individuals are **unsupported** because they do not qualify for the Section 87A rebate and are subject to special tax rates/withholdings.
3. **Primary Income Heads:**
   - **Salary / Pension Income** (Sections 15 to 17).
   - **Business / Professional Income** (Profits and Gains of Business or Profession under Section 28).
4. **Exclusions / Out of Scope:**
   - Special-rate income, including Short-Term Capital Gains under Section 111A and Long-Term Capital Gains under Sections 112 / 112A.
   - House property income / home loan interest under Section 24.
   - Agricultural income (Section 10(1)).
   - Foreign source income / DTAA relief under Sections 90 / 91.
   - Presumptive taxation under Sections 44AD / 44ADA.
   - HRA / LTA exemption calculations.

---

## 2. Distinction: Taxable Income vs. Tax Payable

The calculator separates the computation into two distinct steps:

1. **Estimated Taxable Income (Total Income):**
   $$\text{Taxable Income} = \text{round}_{\text{Sec 288A}}\left(\max\left(0, \text{Gross Income} - \text{Standard Deduction} - \text{Allowed Chapter VI-A Deductions}\right)\right)$$
   *Note: Slabs, rebates, surcharge, and cess are NEVER used to determine Taxable Income.*

2. **Estimated Total Tax Payable:**
   $$\text{Tax Payable} = \text{round}_{\text{Sec 288B}}\left(\max\left(0, \text{Slab Tax} - \text{Section 87A Rebate}\right) + \text{Surcharge} + \text{Health \& Education Cess}\right)$$

---

## 3. Statutory Rounding (Section 288A & Section 288B)

**Source:** Sections 288A and 288B of the Income-tax Act, 1961

- **Section 288A (Rounding off of Total Income):**
  The taxable income is rounded to the nearest multiple of ten rupees. Any paise are ignored; if the last digit of the rupee amount is 5 or more, it is rounded up to the next multiple of ₹10; otherwise, it is rounded down.
- **Section 288B (Rounding off of Tax Payable):**
  The final amount of tax payable (including surcharge and cess) is rounded to the nearest multiple of ten rupees following the same rule.

---

## 4. Financial Year 2024–25 (Assessment Year 2025–26)

### A. New Tax Regime (Section 115BAC) — Default

**Source:** Finance (No. 2) Act, 2024, Section 115BAC(1A)

| Taxable Income Slab (₹) | Slab Rate |
| :--- | :--- |
| **Up to ₹3,00,000** | Nil |
| **₹3,00,001 to ₹7,00,000** | 5% |
| **₹7,00,001 to ₹10,00,000** | 10% |
| **₹10,00,001 to ₹12,00,000** | 15% |
| **₹12,00,001 to ₹15,00,000** | 20% |
| **Above ₹15,00,000** | 30% |

- **Standard Deduction (Salary/Pension only):** ₹75,000 under Section 16(ia) read with Section 115BAC(1A), enhanced by Finance (No. 2) Act, 2024 (capped at actual gross salary; ₹0 for business income).
- **Chapter VI-A Deductions (80C, 80D, etc.):** Nil (not allowable under Section 115BAC).
- **Section 87A Rebate & Marginal Relief:**
  - *Standard Rebate:* Full tax rebate up to ₹25,000 for resident individuals with taxable income up to ₹7,00,000 (resulting in zero tax up to ₹7L taxable income / ₹7.75L gross salary).
  - *Marginal Relief under Proviso (b) to Section 87A:* If taxable income exceeds ₹7,00,000, the rebate equals the amount by which slab tax exceeds the excess income $(\text{Taxable Income} - ₹7,00,000)$. This caps tax after rebate to the incremental income above ₹7,00,000. Marginal relief phases out when normal tax becomes lower than excess income (at ₹7,22,222).

### B. Old Tax Regime (Optional Opt-In)

**Source:** Income-tax Act, 1961, First Schedule to the Finance Act

#### 1. Slabs by Taxpayer Age:
- **Individual below 60 years:**
  - Up to ₹2,50,000: Nil
  - ₹2,50,001 to ₹5,00,000: 5%
  - ₹5,00,001 to ₹10,00,000: 20%
  - Above ₹10,00,000: 30%
- **Senior Citizen (60 to 79 years):**
  - Up to ₹3,00,000: Nil
  - ₹3,00,001 to ₹5,00,000: 5%
  - ₹5,00,001 to ₹10,00,000: 20%
  - Above ₹10,00,000: 30%
- **Super Senior Citizen (80+ years):**
  - Up to ₹5,00,000: Nil
  - ₹5,00,001 to ₹10,00,000: 20%
  - Above ₹10,00,000: 30%

- **Standard Deduction (Salary/Pension only):** ₹50,000 under Section 16(ia).
- **Section 87A Rebate:** Up to ₹12,500 if taxable income $\le ₹5,00,000$. *Note: No marginal relief exists under the Old Regime.*
- **Chapter VI-A Deductions:** Allowed (subject to Section 80A(2) cap at Gross Total Income).

---

## 5. Financial Year 2025–26 (Assessment Year 2026–27) — Income-tax Act, 1961

### A. New Tax Regime (Section 115BAC) — Default

**Source:** Finance Act, 2025 / Union Budget 2025 (PIB Press Release)

| Taxable Income Slab (₹) | Slab Rate |
| :--- | :--- |
| **Up to ₹4,00,000** | Nil |
| **₹4,00,001 to ₹8,00,000** | 5% |
| **₹8,00,001 to ₹12,00,000** | 10% |
| **₹12,00,001 to ₹16,00,000** | 15% |
| **₹16,00,001 to ₹20,00,000** | 20% |
| **₹20,00,001 to ₹24,00,000** | 25% |
| **Above ₹24,00,000** | 30% |

- **Standard Deduction (Salary/Pension only):** ₹75,000 under Section 16(ia).
- **Section 87A Rebate & Marginal Relief:**
  - *Standard Rebate:* Up to ₹60,000 for resident individuals with taxable income up to ₹12,00,000 (resulting in zero tax up to ₹12L taxable income / ₹12.75L gross salary).
  - *Marginal Relief under Proviso (b) to Section 87A:* If taxable income exceeds ₹12,00,000, tax after rebate is restricted to $(\text{Taxable Income} - ₹12,00,000)$. Marginal relief phases out when normal tax becomes lower than excess income (at ₹12,70,588).

### B. Old Tax Regime

The slabs, standard deduction (₹50,000), and 87A rebate (₹12,500 up to ₹5L) remain under the Income-tax Act, 1961 provisions.

---

## 6. Tax Year 2026–27 (Assessment Year 2027–28) — Income-tax Act, 2025

**Governing Statutory Framework:** Income-tax Act, 2025 (as amended by Finance Act 2026)

### A. New Tax Regime (Default Architecture)

**Source:** Income-tax Act, 2025, Section 154 & Section 156

| Taxable Income Slab (₹) | Slab Rate |
| :--- | :--- |
| **Up to ₹4,00,000** | Nil |
| **₹4,00,001 to ₹8,00,000** | 5% |
| **₹8,00,001 to ₹12,00,000** | 10% |
| **₹12,00,001 to ₹16,00,000** | 15% |
| **₹16,00,001 to ₹20,00,000** | 20% |
| **₹20,00,001 to ₹24,00,000** | 25% |
| **Above ₹24,00,000** | 30% |

- **Standard Deduction (Salary/Pension only):** ₹75,000 (strictly ₹0 for business/profession).
- **Tax Rebate & Marginal Relief (Section 156, erstwhile Sec 87A):**
  - *Full Rebate:* Up to ₹60,000 for resident individuals with taxable income up to ₹12,00,000 (nil tax on taxable income $\le ₹12,00,000$ / gross salary $\le ₹12,75,000$).
  - *Marginal Relief:* If taxable income exceeds ₹12,00,000, tax payable after rebate is restricted to $(\text{Taxable Income} - ₹12,00,000)$. Phases out at ₹12,70,588.
- **Surcharge (New Architecture):**
  - Above ₹50 Lakh to ₹1 Crore: 10%
  - Above ₹1 Crore to ₹2 Crore: 15%
  - Above ₹2 Crore: 25% (statutory cap at 25%)
  - Statutory marginal relief protects all surcharge boundaries.

### B. Old Tax Regime (Optional Opt-out under Income-tax Act, 2025)

The optional old regime is retained for taxpayers claiming legacy deductions:
- **Age-Based Basic Exemption:** ₹2,50,000 (<60), ₹3,00,000 (Senior 60–79), ₹5,00,000 (Super Senior 80+).
- **Slabs:** 5% (₹2.5L–₹5L), 20% (₹5L–₹10L), 30% (>₹10L).
- **Standard Deduction:** ₹50,000 for salary/pension.
- **Deductions:** Section 80C (up to ₹1,50,000), Section 80D (Self ₹25k/₹50k, Parents ₹25k/₹50k).
- **Rebate:** Up to ₹12,500 if taxable income $\le ₹5,00,000$ (no marginal relief in Old Regime).
- **Surcharge:** Up to 37% for income above ₹5 Crore.

---

## 7. Deductions Under Chapter VI-A (Old Regime Only)

1. **Section 80C:** Capped at ₹1,50,000 (PPF, ELSS, EPF, Life insurance, NSC, Senior Citizens Savings Scheme).
2. **Section 80D (Health Insurance):**
   - Self & Family (below 60): Up to ₹25,000.
   - Self & Family (senior citizen 60+): Up to ₹50,000 (automatically applied when taxpayer age is 60+).
   - Parents (below 60): Additional up to ₹25,000.
   - Parents (senior citizen 60+): Additional up to ₹50,000.
   - Combined maximum possible: ₹1,00,000 (both self and parents are senior citizens).
3. **Other Chapter VI-A Deductions (80E, 80G, 80TTA, 80TTB, etc.):** Marked out of scope in this release to prevent unverified inputs without statutory limit enforcement.
4. **Section 80A(2) Statutory Ceiling:** Aggregate Chapter VI-A deductions cannot exceed Gross Total Income (cannot create a loss or negative taxable income).

---

## 8. Surcharge & Surcharge Marginal Relief

**Source:** Annual Finance Act read with Section 115BAC / Income-tax Act, 2025

### Surcharge Rates
| Taxable Income Bracket | New Regime Rate | Old Regime Rate |
| :--- | :--- | :--- |
| Up to ₹50,00,000 | Nil | Nil |
| ₹50,00,001 to ₹1,00,00,000 | 10% | 10% |
| ₹1,00,00,001 to ₹2,00,00,000 | 15% | 15% |
| Above ₹2,00,00,000 | **25% (Capped under New Regime)** | **25% (up to 5Cr) / 37% (> 5Cr)** |

### Marginal Relief on Surcharge
Ensures that the incremental tax and surcharge payable on income exceeding a surcharge threshold (₹50L, ₹1Cr, ₹2Cr, ₹5Cr) cannot exceed the incremental income earned above the threshold:
$$\text{Tax} + \text{Surcharge} \le \text{Tax at threshold} + (\text{Taxable Income} - \text{Threshold})$$

---

## 9. Health & Education Cess

**Source:** Finance Act, 2018, Section 2(12A) / Income-tax Act, 2025

- Fixed at **4%** levied on the aggregate of **(Income Tax after Rebate + Surcharge)**.

---

## 10. Official Source References

- **Income Tax Department Official Portal:** [https://incometaxindia.gov.in](https://incometaxindia.gov.in)
- **Income-tax Act, 2025 Statutory Provisions:** [https://incometaxindia.gov.in](https://incometaxindia.gov.in)
- **Income-tax Act, 1961 Official Repository:** [https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx](https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx)
- **Income Tax Rates Archive:** [https://incometaxindia.gov.in/pages/tax-rates.aspx](https://incometaxindia.gov.in/pages/tax-rates.aspx)
- **E-Filing Portal:** [https://www.incometax.gov.in/iec/foportal/](https://www.incometax.gov.in/iec/foportal/)
- **Press Information Bureau (PIB) Tax Releases:** [https://pib.gov.in](https://pib.gov.in)
