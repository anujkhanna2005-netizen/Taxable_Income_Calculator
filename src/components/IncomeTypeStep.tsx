import { useState } from 'react'
import type { IncomeType } from '../tax/calculator'

interface Props {
  selected: IncomeType | null
  onSelect: (type: IncomeType) => void
  onBack: () => void
}

type ExtendedIncomeChoice = IncomeType | 'unsupported'

const incomeTypes: { value: ExtendedIncomeChoice; label: string; sub: string; icon: string; unsupported?: boolean }[] = [
  {
    value: 'salary',
    label: 'Salary / Pension Income',
    sub: 'Income from employment or pension under Section 15-17. Standard deduction under Section 16(ia) applies automatically.',
    icon: '💼',
  },
  {
    value: 'business',
    label: 'Business / Professional Profit',
    sub: 'Net taxable profit from business or profession under Section 28. Standard deduction under Section 16 is NOT available.',
    icon: '🏢',
  },
  {
    value: 'unsupported',
    label: 'Other Income Streams (Capital Gains, Property, Agriculture, Foreign)',
    sub: 'Capital gains (STCG/LTCG), rental house property, agricultural income, or foreign earnings.',
    icon: '⚠️',
    unsupported: true,
  },
]

export default function IncomeTypeStep({ selected, onSelect, onBack }: Props) {
  const [activeChoice, setActiveChoice] = useState<ExtendedIncomeChoice | null>(selected)

  function handleSelect(choice: ExtendedIncomeChoice) {
    setActiveChoice(choice)
    if (choice !== 'unsupported') {
      onSelect(choice)
    }
  }

  return (
    <section className="step-card" aria-labelledby="income-type-heading">
      <h2 id="income-type-heading" className="step-title">Select Primary Income Source</h2>
      <p className="step-desc">
        Choose your primary income source. The calculator shows only the inputs needed for your selected path.
      </p>

      <div className="radio-group" role="radiogroup" aria-labelledby="income-type-heading">
        {incomeTypes.map(t => (
          <label
            key={t.value}
            className={`radio-card ${activeChoice === t.value ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="incomeType"
              value={t.value}
              checked={activeChoice === t.value}
              onChange={() => handleSelect(t.value)}
              className="sr-only"
            />
            <div className="radio-card-content">
              <span className="radio-card-title">
                {t.icon} {t.label}
                {t.unsupported && <span className="badge badge-grey" style={{ marginLeft: '6px' }}>Unsupported</span>}
              </span>
              <span className="radio-card-sub">{t.sub}</span>
            </div>
            <span className="radio-check" aria-hidden="true" />
          </label>
        ))}
      </div>

      {activeChoice === 'unsupported' ? (
        <div className="callout callout-warning" style={{ marginTop: '1.25rem' }} role="region" aria-label="Unsupported income notice">
          <strong>⚠️ Unsupported Income Stream — Calculation Withheld:</strong>
          <p style={{ margin: '0.35rem 0' }}>
            To protect taxpayers from misleading estimates, this calculator withholds calculation for the following complex heads:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.25rem 0 0.5rem 0' }}>
            <li><strong>Capital Gains:</strong> Short-Term (Sec 111A @ 15%/20%) and Long-Term (Sec 112/112A @ 10%/12.5%/20%) require special tax rates and cannot be combined under normal slab rates. Section 87A rebate is barred against Sec 112A LTCG.</li>
            <li><strong>House Property Income:</strong> Requires municipal tax deductions, Section 24(a) statutory 30% allowance, and Section 24(b) home loan interest deduction (up to ₹2 Lakhs).</li>
            <li><strong>Agricultural Income:</strong> Governed by partial integration rate rules under the Annual Finance Act.</li>
            <li><strong>Presumptive Taxation:</strong> Section 44AD / 44ADA requires gross receipts declarations and deemed profit percentages.</li>
            <li><strong>Foreign Income / Double Taxation:</strong> Governed by DTAA relief under Sections 90 / 91.</li>
          </ul>
          <p className="text-small text-muted" style={{ margin: '0.35rem 0' }}>
            If you have income from any of these heads, please consult a qualified Chartered Accountant for an accurate multi-head tax computation.
          </p>
          <div className="step-actions" style={{ marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={onBack}>← Back</button>
            <button
              className="btn btn-primary"
              onClick={() => setActiveChoice(null)}
            >
              Choose Supported Income Type
            </button>
          </div>
        </div>
      ) : (
        <div className="step-actions">
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          <button
            className="btn btn-primary"
            onClick={() => activeChoice && onSelect(activeChoice)}
            disabled={!activeChoice}
          >
            Continue →
          </button>
        </div>
      )}
    </section>
  )
}
