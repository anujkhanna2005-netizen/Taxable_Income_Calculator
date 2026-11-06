import type { CalculationResult } from '../tax/calculator'
import { formatRupees } from '../utils/format'

interface Props {
  result: CalculationResult
  onEditDetails: () => void
  onStartOver: () => void
}

export default function ResultsView({ result, onEditDetails, onStartOver }: Props) {
  const regimeLabel = result.regime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'
  const incomeLabel = result.incomeType === 'salary' ? 'Salary / Pension' : 'Business / Profession'

  return (
    <section className="results-card" aria-labelledby="results-heading">
      <h2 id="results-heading" className="step-title">Tax Estimate Results</h2>

      {/* Taxpayer & Year Badges */}
      <div className="result-tags">
        <span className="badge badge-purple">{result.governingAct}</span>
        <span className="badge badge-blue">{result.financialYearLabel}</span>
        <span className="badge badge-purple">{result.assessmentYearLabel}</span>
        <span className="badge badge-green">{regimeLabel}</span>
        <span className="badge badge-grey">{incomeLabel}</span>
        <span className="badge badge-blue">Resident Individual</span>
      </div>

      {/* Statutory Warnings & Relief Notes */}
      {result.warnings.length > 0 && (
        <div className="callout callout-warning" role="alert">
          <strong>⚠️ Notes &amp; Statutory Adjustments:</strong>
          <ul>
            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Key Figures - Prominently Distinct */}
      <div className="key-figures">
        <div className="key-figure">
          <span className="key-figure-label">Estimated Taxable Income</span>
          <span className="key-figure-value key-figure-blue">{formatRupees(result.taxableIncome)}</span>
          <span className="text-small text-muted">Sec 288A rounded (Gross − Deductions)</span>
        </div>
        <div className="key-figure key-figure-highlight">
          <span className="key-figure-label">Estimated Total Tax Payable</span>
          <span className="key-figure-value key-figure-green">{formatRupees(result.totalTaxPayable)}</span>
          <span className="text-small text-muted">Sec 288B rounded (incl. Cess &amp; Rebate)</span>
        </div>
        <div className="key-figure">
          <span className="key-figure-label">Effective Tax Rate</span>
          <span className="key-figure-value">{result.effectiveRate.toFixed(2)}%</span>
          <span className="text-small text-muted">On Gross Income</span>
        </div>
      </div>

      {/* STEP 1 BREAKDOWN: TAXABLE INCOME */}
      <div className="breakdown-section">
        <h3 className="section-subtitle">1. Computation of Taxable Income</h3>
        <p className="text-small text-muted">
          Taxable income is determined strictly by subtracting eligible statutory deductions from gross income, before slab rates.
        </p>
        <table className="breakdown-table" aria-label="Taxable income computation breakdown">
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col" className="text-right">Amount</th>
              <th scope="col">Notes / Section</th>
            </tr>
          </thead>
          <tbody>
            {result.taxableIncomeBreakdown.map((item, i) => (
              <tr
                key={i}
                className={item.label.includes('Estimated Taxable Income') ? 'row-subtotal' : ''}
              >
                <td>{item.label}</td>
                <td className={`text-right ${item.amount < 0 ? 'text-green' : ''}`}>
                  {item.amount < 0 ? `(${formatRupees(Math.abs(item.amount))})` : formatRupees(item.amount)}
                </td>
                <td className="text-muted text-small">{item.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* STEP 2 BREAKDOWN: TAX PAYABLE */}
      <div className="breakdown-section">
        <h3 className="section-subtitle">2. Computation of Estimated Tax Payable</h3>
        <p className="text-small text-muted">
          Computed on the estimated taxable income of {formatRupees(result.taxableIncome)} using applicable slab rates, Section 87A rebate (with marginal relief), surcharge, and 4% Health &amp; Education Cess.
        </p>
        <table className="breakdown-table" aria-label="Tax payable computation breakdown">
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col" className="text-right">Amount</th>
              <th scope="col">Notes / Provision</th>
            </tr>
          </thead>
          <tbody>
            {result.taxPayableBreakdown.map((item, i) => (
              <tr
                key={i}
                className={item.label === 'Estimated Total Tax Payable' ? 'row-total' : ''}
              >
                <td>{item.label}</td>
                <td className={`text-right ${item.amount < 0 ? 'text-green' : ''}`}>
                  {item.amount < 0 ? `(${formatRupees(Math.abs(item.amount))})` : formatRupees(item.amount)}
                </td>
                <td className="text-muted text-small">{item.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assumptions & Methodology */}
      {result.assumptions.length > 0 && (
        <details className="assumptions-section">
          <summary className="assumptions-toggle">📋 Taxpayer Assumptions &amp; Legal Rules Applied</summary>
          <ul className="assumptions-list">
            {result.assumptions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </details>
      )}

      {/* Legal Sources with Links */}
      <details className="assumptions-section">
        <summary className="assumptions-toggle">📚 Official Sources &amp; Legal Basis (incometaxindia.gov.in)</summary>
        <ul className="sources-list">
          {result.sources.map((s, i) => (
            <li key={i}>
              <strong>{s.rule}</strong> ({s.section}, {s.applicableYear}):{' '}
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.source} ↗</a>
            </li>
          ))}
        </ul>
      </details>

      {/* Official Disclaimer */}
      <div className="disclaimer" role="note">
        <strong>⚠️ Non-Assessment Disclaimer:</strong> This calculator provides an informative
        estimation for resident individuals in India based on public provisions of the Income-tax Act,
        1961. It is <em>not an official assessment, tax filing, or legal tax advice</em>. It does not
        account for unentered deductions, capital gains, property income, agricultural income, or
        foreign assets. Always consult a qualified Chartered Accountant (CA) and verify calculations
        on the official portal of the Income Tax Department of India (
        <a href="https://incometax.gov.in" target="_blank" rel="noopener noreferrer">incometax.gov.in</a>).
      </div>

      {/* Action Buttons */}
      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onEditDetails}>✏️ Edit Details</button>
        <button className="btn btn-primary" onClick={onStartOver}>🔄 Calculate Again (Start Over)</button>
      </div>
    </section>
  )
}
