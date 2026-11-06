import { useState } from 'react'
import type { Regime, AgeCategory, SalaryInputs } from '../tax/calculator'
import { parseRupeeInput, formatRupeesPlain } from '../utils/format'

interface Props {
  regime: Regime
  onSubmit: (ageCategory: AgeCategory, inputs: SalaryInputs) => void
  onBack: () => void
}

const AGE_OPTIONS: { value: AgeCategory; label: string }[] = [
  { value: 'below60',  label: 'Below 60 years' },
  { value: '60to79',   label: '60–79 years (Senior Citizen)' },
  { value: '80plus',   label: '80+ years (Super Senior Citizen)' },
]

export default function SalaryForm({ regime, onSubmit, onBack }: Props) {
  const [grossSalary, setGrossSalary]           = useState('')
  const [ageCategory, setAgeCategory]           = useState<AgeCategory>('below60')
  const [section80C, setSection80C]             = useState('')
  const [section80D_self, setSection80D_self]   = useState('')
  const [section80D_par, setSection80D_par]     = useState('')
  const [parentsSenior, setParentsSenior]       = useState(false)
  const [errors, setErrors]                     = useState<Record<string, string>>({})

  const isOld = regime === 'old'
  const isTaxpayerSenior = ageCategory !== 'below60'
  const sdAmount = regime === 'new' ? '₹75,000' : '₹50,000'

  function validate(): boolean {
    const errs: Record<string, string> = {}
    const salary = parseRupeeInput(grossSalary)
    if (salary === null || isNaN(salary)) {
      errs.grossSalary = 'Please enter a valid annual salary or pension in ₹ (e.g. 10,00,000).'
    } else if (salary < 0) {
      errs.grossSalary = 'Salary cannot be negative.'
    } else if (salary > 1_000_000_000) {
      errs.grossSalary = 'Amount exceeds supported calculation threshold (₹100 Crore).'
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
    const inputs: SalaryInputs = {
      grossSalary: parseRupeeInput(grossSalary) ?? 0,
      hasStandardDeduction: true,
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
    <section className="step-card" aria-labelledby="salary-form-heading">
      <h2 id="salary-form-heading" className="step-title">Salary / Pension Details</h2>

      <div className="callout callout-info" role="region" aria-label="Standard deduction notice">
        Standard deduction of <strong>{sdAmount}</strong> will be applied automatically as per Section 16(ia).
        Enter your gross salary/pension before Section 16 standard deduction. Do <strong>not</strong> subtract standard deduction yourself.
        {isOld && (
          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem' }}>
            Note: If you are eligible for Section 10 allowances/exemptions (such as HRA under Sec 10(13A) or LTA under Sec 10(5)) under the Old Regime, subtract them from your gross salary before entering here, as this calculator does not estimate Section 10 exemptions.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Gross Salary */}
        <div className="form-group">
          <label htmlFor="grossSalary" className="form-label">
            Gross Annual Salary / Pension Income (₹) <span className="required">*</span>
          </label>
          <div className="input-prefix-wrapper">
            <span className="input-prefix">₹</span>
            <input
              id="grossSalary"
              type="text"
              inputMode="numeric"
              className={`form-input ${errors.grossSalary ? 'input-error' : ''}`}
              value={grossSalary}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                const n = parseInt(raw, 10)
                setGrossSalary(isNaN(n) ? '' : formatRupeesPlain(n))
              }}
              placeholder="e.g. 10,00,000"
              aria-describedby={errors.grossSalary ? 'grossSalary-err' : 'grossSalary-hint'}
              required
            />
          </div>
          <p id="grossSalary-hint" className="form-hint">
            Annual gross salary/pension as per Form 16 Part B before Section 16(ia) standard deduction.
            Exemptions such as HRA (Sec 10(13A)) or LTA (Sec 10(5)) are not automatically assumed or calculated.
          </p>
          {errors.grossSalary && (
            <p id="grossSalary-err" className="form-error" role="alert">
              {errors.grossSalary}
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
              ? 'In the New Tax Regime, tax slabs are uniform across all age groups.'
              : 'In the Old Tax Regime, age determines your basic exemption limit (₹2.5L / ₹3L / ₹5L) and Section 80D health insurance limits.'}
          </p>
        </div>

        {/* Old Regime Chapter VI-A Deductions */}
        {isOld && (
          <div className="old-regime-section">
            <h3 className="section-subtitle">Supported Chapter VI-A Deductions (Old Regime Only)</h3>
            <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
              Only verified statutory deductions under Section 80C and Section 80D are supported.
              Capped at Gross Total Income per Section 80A(2).
            </p>

            {/* Section 80C */}
            <div className="form-group">
              <label htmlFor="section80C" className="form-label">
                Section 80C Deductions (₹)
              </label>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">₹</span>
                <input
                  id="section80C"
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
                  aria-describedby="section80C-hint"
                />
              </div>
              <p id="section80C-hint" className="form-hint">
                Covers PPF, ELSS mutual funds, EPF employee contribution, Life insurance premium, NSC, etc. Statutory ceiling: ₹1,50,000.
              </p>
              {errors.section80C && <p className="form-error" role="alert">{errors.section80C}</p>}
            </div>

            {/* Section 80D - Self */}
            <div className="form-group">
              <label htmlFor="section80D_self" className="form-label">
                Section 80D – Health Insurance (Self, Spouse &amp; Dependent Children) (₹)
              </label>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">₹</span>
                <input
                  id="section80D_self"
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
                  aria-describedby="section80D-self-hint"
                />
              </div>
              <p id="section80D-self-hint" className="form-hint">
                {isTaxpayerSenior
                  ? 'As a Senior Citizen (60+), your Section 80D limit for self & family is ₹50,000.'
                  : 'Statutory cap is ₹25,000 for non-senior taxpayers (increased to ₹50,000 if aged 60+).'}
              </p>
              {errors.section80D_self && <p className="form-error" role="alert">{errors.section80D_self}</p>}
            </div>

            {/* Section 80D - Parents */}
            <div className="form-group">
              <label htmlFor="section80D_par" className="form-label">
                Section 80D – Health Insurance (Parents) (₹)
              </label>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">₹</span>
                <input
                  id="section80D_par"
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
