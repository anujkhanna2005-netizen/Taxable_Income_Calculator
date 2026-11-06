import { useState } from 'react'
import type { TaxYear } from '../tax/calculator'

interface Props {
  selected: TaxYear | null
  onSelect: (year: TaxYear) => void
}

const years: {
  value: TaxYear
  label: string
  ayLabel: string
  actLabel: string
  sub: string
  badge?: string
}[] = [
  {
    value: '2026-27',
    label: 'Tax Year 2026–27',
    ayLabel: 'Assessment Year 2027–28',
    actLabel: 'Income-tax Act, 2025 (as amended by Finance Act 2026)',
    sub: 'Income earned 1 April 2026 – 31 March 2027. New structural architecture under the Income-tax Act, 2025 (Nil tax up to ₹12L in New Regime).',
    badge: 'Income-tax Act, 2025',
  },
  {
    value: '2025-26',
    label: 'FY 2025–26',
    ayLabel: 'Assessment Year 2026–27',
    actLabel: 'Income-tax Act, 1961 (Finance Act, 2025)',
    sub: 'Income earned 1 April 2025 – 31 March 2026 under the Income-tax Act, 1961 (Budget 2025 revised slabs, ₹75k standard deduction).',
  },
  {
    value: '2024-25',
    label: 'FY 2024–25',
    ayLabel: 'Assessment Year 2025–26',
    actLabel: 'Income-tax Act, 1961 (Finance (No. 2) Act, 2024)',
    sub: 'Income earned 1 April 2024 – 31 March 2025 under the Income-tax Act, 1961 (Standard deduction ₹75k New / ₹50k Old).',
    badge: 'Historical (1961 Act)',
  },
]

export default function TaxYearStep({ selected, onSelect }: Props) {
  const [isResident, setIsResident] = useState<'yes' | 'no'>('yes')

  return (
    <section className="step-card" aria-labelledby="year-heading">
      <h2 id="year-heading" className="step-title">Select Tax Year &amp; Governing Act</h2>
      <p className="step-desc">
        Choose the tax period during which income was or will be earned. The governing statutory Act and Assessment Year (AY) are shown alongside.
      </p>

      {/* Residency Verification */}
      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
        <fieldset>
          <legend className="form-label">
            Residential Status &amp; Taxpayer Category <span className="required">*</span>
          </legend>
          <div className="radio-inline-group" style={{ flexDirection: 'column', gap: '8px' }}>
            <label className="radio-inline">
              <input
                type="radio"
                name="residency"
                value="yes"
                checked={isResident === 'yes'}
                onChange={() => setIsResident('yes')}
              />
              Individual Resident in India (Supported)
            </label>
            <label className="radio-inline">
              <input
                type="radio"
                name="residency"
                value="no"
                checked={isResident === 'no'}
                onChange={() => setIsResident('no')}
              />
              Non-Resident (NRI) / RNOR / Non-Individual (HUF, Firm, LLP, Company)
            </label>
          </div>
        </fieldset>
      </div>

      {isResident === 'no' ? (
        <div className="callout callout-warning" role="region" aria-label="Unsupported taxpayer notice">
          <strong>⚠️ Unsupported Taxpayer Scenario — Calculation Withheld:</strong>
          <p style={{ margin: '0.4rem 0' }}>
            This calculator is strictly engineered for <strong>Resident Individuals</strong> under Section 6 of the Income-tax Act, 1961.
          </p>
          <ul style={{ margin: '0.25rem 0 0.5rem 1.25rem', padding: 0 }}>
            <li>Non-Residents (NRIs) and RNORs are <strong>not eligible</strong> for the Section 87A rebate and are subject to special tax rates, treaty provisions (DTAA u/s 90/91), and differing basic exemption thresholds.</li>
            <li>HUFs, partnership firms, LLPs, and companies are assessed under entirely different tax slabs and surcharge rates.</li>
          </ul>
          <p style={{ margin: '0.4rem 0', fontSize: '0.85rem' }}>
            To prevent producing a misleading estimate, calculation is disabled for non-resident and non-individual cases. Please consult a Chartered Accountant.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            style={{ marginTop: '0.5rem' }}
            onClick={() => setIsResident('yes')}
          >
            ← Switch to Resident Individual
          </button>
        </div>
      ) : (
        <>
          <div className="radio-group" role="radiogroup" aria-labelledby="year-heading">
            {years.map(y => (
              <label
                key={y.value}
                className={`radio-card ${selected === y.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="taxYear"
                  value={y.value}
                  checked={selected === y.value}
                  onChange={() => onSelect(y.value)}
                  className="sr-only"
                />
                <div className="radio-card-content">
                  <span className="radio-card-title">
                    {y.label}
                    {y.badge && <span className="badge badge-green">{y.badge}</span>}
                  </span>
                  <span className="radio-card-ay">
                    {y.ayLabel} • <span style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>{y.actLabel}</span>
                  </span>
                  <span className="radio-card-sub">{y.sub}</span>
                </div>
                <span className="radio-check" aria-hidden="true" />
              </label>
            ))}
          </div>

          <div className="callout callout-info" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
            🔒 <strong>Private &amp; Client-Side:</strong> No PAN, name, phone, or financial data is collected or sent to a server. All calculations run strictly in your browser.
          </div>

          <div className="step-actions">
            <button
              className="btn btn-primary"
              onClick={() => selected && onSelect(selected)}
              disabled={!selected}
            >
              Continue →
            </button>
          </div>
        </>
      )}
    </section>
  )
}
