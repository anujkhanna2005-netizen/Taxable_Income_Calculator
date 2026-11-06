import { useState } from 'react'
import type { Regime, AgeCategory, BusinessInputs } from '../tax/calculator'
import { parseRupeeInput, formatRupeesPlain } from '../utils/format'

interface Props {
  regime: Regime
  onSubmit: (ageCategory: AgeCategory, inputs: BusinessInputs) => void
  onBack: () => void
}

const AGE_OPTIONS: { value: AgeCategory; label: string }[] = [
  { value: 'below60',  label: 'Below 60 years' },
  { value: '60to79',   label: '60–79 years (Senior Citizen)' },
  { value: '80plus',   label: '80+ years (Super Senior Citizen)' },
]

export default function BusinessForm({ regime, onSubmit, onBack }: Props) {
  const [netProfit, setNetProfit]               = useState('')
  const [ageCategory, setAgeCategory]           = useState<AgeCategory>('below60')
  const [section80C, setSection80C]             = useState('')
  const [section80D_self, setSection80D_self]   = useState('')
  const [section80D_par, setSection80D_par]     = useState('')
  const [parentsSenior, setParentsSenior]       = useState(false)
  const [errors, setErrors]                     = useState<Record<string, string>>({})

  const isOld = regime === 'old'
  const isTaxpayerSenior = ageCategory !== 'below60'

  function validate(): boolean {
    const errs: Record<string, string> = {}
    const profit = parseRupeeInput(netProfit)
    if (profit === null || isNaN(profit)) {
      errs.netProfit = 'Please enter a valid net taxable profit in ₹ (e.g. 8,00,000).'
    } else if (profit < 0) {
      errs.netProfit = 'Net profit cannot be negative. If your business incurred a loss, enter 0.'
    } else if (profit > 1_000_000_000) {
      errs.netProfit = 'Amount exceeds supported calculation threshold (₹100 Crore).'
    }

    if (isOld) {
      const c = parseRupeeInput(section80C)
      if (c !== null && c < 0) errs.section80C = 'Section 80C deduction cannot be negative.'
      const d = parseRupeeInput(section80D_self)
      if (d !== null && d < 0) errs.section80D_self = 'Health insurance deduction cannot be negative.'
      const dp = parseRupeeInput(section80D_par)
      if (dp !== null && dp < 0) errs.section80D_par = 'Health insurance deduction cannot be negative.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const inputs: BusinessInputs = {
      netProfitBeforeTax: parseRupeeInput(netProfit) ?? 0,
      ...(isOld && {
        section80C: parseRupeeInput(section80C) ?? 0,
        section80D_self: parseRupeeInput(section80D_self) ?? 0,
        section80D_parents: parseRupeeInput(section80D_par) ?? 0,
        parentsSeniorCitizen: parentsSenior,
      }),
    }
    onSubmit(ageCategory, inputs)
  }

  return (
    <section className="step-card" aria-labelledby="business-form-heading">
      <h2 id="business-form-heading" className="step-title">Business / Professional Profit</h2>

      <div className="callout callout-info" role="region" aria-label="Business income guidelines">
        <strong>What to enter:</strong> Enter your <em>Net Taxable Profit (Profit before Tax)</em>.
        This is your gross turnover/receipts minus allowable business expenses and depreciation under Sections 30 to 43D, before income tax.
        <ul style={{ margin: '0.4rem 0 0.2rem 1.25rem', padding: 0 }}>
          <li>Do <strong>not</strong> enter your turnover or gross receipts.</li>
          <li><strong>No Standard Deduction:</strong> Section 16(ia) is strictly for salary/pension income and does not apply to business income.</li>
          <li>Presumptive taxation (Sec 44AD/44ADA), brought-forward business losses, and audit adjustments are not computed by this tool.</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Net Profit */}
        <div className="form-group">
          <label htmlFor="netProfit" className="form-label">
            Net Taxable Business / Professional Profit (₹) <span className="required">*</span>
          </label>
          <div className="input-prefix-wrapper">
            <span className="input-prefix">₹</span>
            <input
              id="netProfit"
              type="text"
              inputMode="numeric"
              className={`form-input ${errors.netProfit ? 'input-error' : ''}`}
              value={netProfit}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                const n = parseInt(raw, 10)
                setNetProfit(isNaN(n) ? '' : formatRupeesPlain(n))
              }}
              placeholder="e.g. 8,00,000"
              aria-describedby={errors.netProfit ? 'netProfit-err' : 'netProfit-hint'}
              required
            />
          </div>
          <p id="netProfit-hint" className="form-hint">
            Net profit before income tax after all deductible operating expenses and depreciation.
          </p>
          {errors.netProfit && (
            <p id="netProfit-err" className="form-error" role="alert">
              {errors.netProfit}
            </p>
          )}
        </div>

        {/* Age Category */}
        <div className="form-group">
          <fieldset>
            <legend className="form-label">
              Taxpayer Age Category <span className="required">*</span>
            </legend>
            <div className="radio-inline-group">
              {AGE_OPTIONS.map(opt => (
                <label key={opt.value} className="radio-inline">
                  <input
                    type="radio"
                    name="ageCategory"
                    value={opt.value}
                    checked={ageCategory === opt.value}
                    onChange={() => setAgeCategory(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="form-hint">
            {regime === 'new'
              ? 'New Tax Regime slabs are uniform across all age groups.'
              : 'Old Tax Regime basic exemption thresholds are ₹2.5L (under 60), ₹3L (60 to 79), and ₹5L (80+).'}
          </p>
        </div>

        {/* Old Regime Chapter VI-A Deductions */}
        {isOld && (
          <div className="old-regime-section">
            <h3 className="section-subtitle">Supported Chapter VI-A Deductions (Old Regime Only)</h3>
            <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
              Deductions available against business profit under Old Regime, capped at Gross Total Income per Section 80A(2).
            </p>

            {/* Section 80C */}
            <div className="form-group">
              <label htmlFor="biz-section80C" className="form-label">
                Section 80C Deductions (₹)
              </label>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">₹</span>
                <input
                  id="biz-section80C"
                  type="text"
                  inputMode="numeric"
                  className={`form-input ${errors.section80C ? 'input-error' : ''}`}
                  value={section80C}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    const n = parseInt(raw, 10)
                    setSection80C(isNaN(n) ? '' : formatRupeesPlain(n))
                  }}
                  placeholder="Max ₹1,50,000"
                  aria-describedby="biz-80C-hint"
                />
              </div>
              <p id="biz-80C-hint" className="form-hint">
                PPF, ELSS mutual funds, Life insurance premium, etc. Capped at ₹1,50,000.
              </p>
              {errors.section80C && <p className="form-error" role="alert">{errors.section80C}</p>}
            </div>

            {/* Section 80D - Self */}
            <div className="form-group">
              <label htmlFor="biz-section80D_self" className="form-label">
                Section 80D – Health Insurance (Self &amp; Family) (₹)
              </label>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">₹</span>
                <input
                  id="biz-section80D_self"
                  type="text"
                  inputMode="numeric"
                  className={`form-input ${errors.section80D_self ? 'input-error' : ''}`}
                  value={section80D_self}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    const n = parseInt(raw, 10)
                    setSection80D_self(isNaN(n) ? '' : formatRupeesPlain(n))
                  }}
                  placeholder={isTaxpayerSenior ? 'Max ₹50,000 (Senior Citizen)' : 'Max ₹25,000'}
                  aria-describedby="biz-80D-self-hint"
                />
              </div>
              <p id="biz-80D-self-hint" className="form-hint">
                {isTaxpayerSenior
                  ? 'As a Senior Citizen (60+), your Section 80D limit for self & family is ₹50,000.'
                  : 'Statutory cap is ₹25,000 for non-senior taxpayers (increased to ₹50,000 if aged 60+).'}
              </p>
              {errors.section80D_self && <p className="form-error" role="alert">{errors.section80D_self}</p>}
            </div>

            {/* Section 80D - Parents */}
            <div className="form-group">
              <label htmlFor="biz-section80D_par" className="form-label">
                Section 80D – Health Insurance (Parents) (₹)
              </label>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">₹</span>
                <input
                  id="biz-section80D_par"
                  type="text"
                  inputMode="numeric"
                  className={`form-input ${errors.section80D_par ? 'input-error' : ''}`}
                  value={section80D_par}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    const n = parseInt(raw, 10)
                    setSection80D_par(isNaN(n) ? '' : formatRupeesPlain(n))
                  }}
                  placeholder={parentsSenior ? 'Max ₹50,000 (Senior Citizens)' : 'Max ₹25,000'}
                />
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={parentsSenior}
                  onChange={e => setParentsSenior(e.target.checked)}
                />
                Parents are senior citizens (60+) — statutory cap increases from ₹25,000 to ₹50,000
              </label>
              {errors.section80D_par && <p className="form-error" role="alert">{errors.section80D_par}</p>}
            </div>
          </div>
        )}

        <div className="step-actions">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <button type="submit" className="btn btn-primary">
            Calculate Tax →
          </button>
        </div>
      </form>
    </section>
  )
}
