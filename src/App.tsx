import { useState } from 'react'
import TaxYearStep from './components/TaxYearStep'
import RegimeStep from './components/RegimeStep'
import IncomeTypeStep from './components/IncomeTypeStep'
import SalaryForm from './components/SalaryForm'
import BusinessForm from './components/BusinessForm'
import ResultsView from './components/ResultsView'
import QRCodeSection from './components/QRCodeSection'
import { type TaxYear, type Regime, type IncomeType, type AgeCategory,
  type SalaryInputs, type BusinessInputs, type CalculationResult,
  calculateTax } from './tax/calculator'
import './App.css'

type Step = 'year' | 'regime' | 'incomeType' | 'incomeInput' | 'results'

interface AppState {
  step: Step
  taxYear: TaxYear | null
  regime: Regime | null
  incomeType: IncomeType | null
  result: CalculationResult | null
}

export default function App() {
  const [state, setState] = useState<AppState>({
    step: 'year',
    taxYear: null,
    regime: null,
    incomeType: null,
    result: null,
  })
  const [calcError, setCalcError] = useState<string | null>(null)

  function handleYearSelect(year: TaxYear) {
    setState(s => ({ ...s, taxYear: year, step: 'regime' }))
  }

  function handleRegimeSelect(regime: Regime) {
    setState(s => ({ ...s, regime, step: 'incomeType' }))
  }

  function handleIncomeTypeSelect(incomeType: IncomeType) {
    setState(s => ({ ...s, incomeType, step: 'incomeInput' }))
  }

  function handleFormSubmit(ageCategory: AgeCategory, inputs: SalaryInputs | BusinessInputs) {
    setCalcError(null)
    try {
      const result = calculateTax(
        state.taxYear!,
        state.regime!,
        state.incomeType!,
        ageCategory,
        inputs
      )
      setState(s => ({ ...s, result, step: 'results' }))
    } catch (e) {
      setCalcError(e instanceof Error ? e.message : 'An error occurred during calculation.')
    }
  }

  function handleEditDetails() {
    setState(s => ({ ...s, step: 'incomeInput', result: null }))
    setCalcError(null)
  }

  function handleStartOver() {
    setState({ step: 'year', taxYear: null, regime: null, incomeType: null, result: null })
    setCalcError(null)
  }

  function handleBack() {
    setCalcError(null)
    setState(s => {
      switch (s.step) {
        case 'regime':     return { ...s, step: 'year' }
        case 'incomeType': return { ...s, step: 'regime' }
        case 'incomeInput':return { ...s, step: 'incomeType' }
        default:           return s
      }
    })
  }

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1 className="app-title">🇮🇳 Indian Income Tax Estimator</h1>
        <p className="app-subtitle">Resident Individuals · Tax Year 2026–27 (Income-tax Act, 2025) &amp; Historical Years (1961 Act)</p>
      </header>

      <QRCodeSection />

      <main className="app-main">
        {/* Step indicator */}
        {state.step !== 'results' && (
          <div className="step-indicator" aria-label="Progress">
            {(['year','regime','incomeType','incomeInput'] as Step[]).map((s, i) => (
              <div key={s} className={`step-dot ${state.step === s ? 'active' : ''} ${isStepDone(state.step, s) ? 'done' : ''}`} aria-hidden="true">
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {calcError && (
          <div className="error-banner" role="alert">{calcError}</div>
        )}

        {state.step === 'year' && (
          <TaxYearStep selected={state.taxYear} onSelect={handleYearSelect} />
        )}
        {state.step === 'regime' && (
          <RegimeStep
            selected={state.regime}
            onSelect={handleRegimeSelect}
            onBack={handleBack}
          />
        )}
        {state.step === 'incomeType' && (
          <IncomeTypeStep
            selected={state.incomeType}
            onSelect={handleIncomeTypeSelect}
            onBack={handleBack}
          />
        )}
        {state.step === 'incomeInput' && state.incomeType === 'salary' && (
          <SalaryForm
            regime={state.regime!}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
          />
        )}
        {state.step === 'incomeInput' && state.incomeType === 'business' && (
          <BusinessForm
            regime={state.regime!}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
          />
        )}
        {state.step === 'results' && state.result && (
          <ResultsView
            result={state.result}
            onEditDetails={handleEditDetails}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>This tool is for general information only. Not for official tax filing.</p>
        <p>Always consult a qualified Chartered Accountant for personalised advice.</p>
      </footer>
    </div>
  )
}

function isStepDone(currentStep: Step, checkStep: Step): boolean {
  const order: Step[] = ['year', 'regime', 'incomeType', 'incomeInput', 'results']
  return order.indexOf(currentStep) > order.indexOf(checkStep)
}
