import type { Regime } from '../tax/calculator'

interface Props {
  selected: Regime | null
  onSelect: (regime: Regime) => void
  onBack: () => void
}

const regimes: { value: Regime; label: string; sub: string; points: string[] }[] = [
  {
    value: 'new',
    label: 'New Tax Regime (Default Regime)',
    sub: 'Default statutory regime with concessional tax slabs',
    points: [
      'Lower slab tax rates across income brackets',
      'Standard deduction of ₹75,000 for salaried individuals & pensioners',
      'Full tax rebate (Nil tax up to ₹12L in TY 2026–27 & FY 25–26; ₹7L in FY 24–25)',
      'Statutory marginal relief for income marginally exceeding rebate cutoff',
      'Chapter VI-A deductions (80C, 80D, etc.) & HRA/LTA are NOT allowable',
    ],
  },
  {
    value: 'old',
    label: 'Old Tax Regime (Optional Opt-In)',
    sub: 'Traditional slabs requiring explicit opt-in at filing',
    points: [
      'Standard deduction of ₹50,000 for salary / pension income',
      'Section 80C deductions permitted (up to ₹1,50,000)',
      'Section 80D health insurance deductions permitted',
      'Slab basic exemption varies by age (₹2.5L / ₹3L / ₹5L)',
      'Tax rebate up to ₹12,500 (taxable income ≤ ₹5,00,000; no marginal relief)',
    ],
  },
]

export default function RegimeStep({ selected, onSelect, onBack }: Props) {
  return (
    <section className="step-card" aria-labelledby="regime-heading">
      <h2 id="regime-heading" className="step-title">Select Tax Regime</h2>
      <p className="step-desc">
        India offers two tax regimes for individuals. The <strong>New Regime</strong> is the default with concessional slabs. The <strong>Old Regime</strong> can be opted for if you have substantial tax deductions.
      </p>

      <div className="radio-group" role="radiogroup" aria-labelledby="regime-heading">
        {regimes.map(r => (
          <label
            key={r.value}
            className={`radio-card ${selected === r.value ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="regime"
              value={r.value}
              checked={selected === r.value}
              onChange={() => onSelect(r.value)}
              className="sr-only"
            />
            <div className="radio-card-content">
              <span className="radio-card-title">{r.label}</span>
              <span className="radio-card-sub">{r.sub}</span>
              <ul className="radio-card-points">
                {r.points.map(p => <li key={p}>{p}</li>)}
              </ul>
            </div>
            <span className="radio-check" aria-hidden="true" />
          </label>
        ))}
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
        >
          Continue →
        </button>
      </div>
    </section>
  )
}
