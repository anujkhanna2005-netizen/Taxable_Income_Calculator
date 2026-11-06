import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('End-to-End User Flow in App', () => {
  it('navigates from Year Selection to Results and allows Start Over (Tax Year 2026–27 under Income-tax Act, 2025)', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Step 1: Select Year (Resident Individual is selected by default)
    expect(screen.getByRole('heading', { name: /select.*year/i })).toBeInTheDocument()
    await user.click(screen.getByLabelText(/Tax Year 2026–27/i))

    // Step 2: Select Regime
    expect(screen.getByRole('heading', { name: /select tax regime/i })).toBeInTheDocument()
    await user.click(screen.getByLabelText(/new tax regime/i))

    // Step 3: Select Income Type
    expect(screen.getByRole('heading', { name: /select primary income source/i })).toBeInTheDocument()
    await user.click(screen.getByLabelText(/salary \/ pension/i))

    // Step 4: Income Input
    expect(screen.getByRole('heading', { name: /salary \/ pension details/i })).toBeInTheDocument()
    const salaryInput = screen.getByLabelText(/gross annual salary/i)
    await user.type(salaryInput, '1275000')
    await user.click(screen.getByRole('button', { name: /calculate tax/i }))

    // Step 5: Results View
    expect(screen.getByRole('heading', { name: /tax estimate results/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Income-tax Act, 2025/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/estimated taxable income/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/estimated total tax payable/i).length).toBeGreaterThanOrEqual(1)

    // Gross: 12,75,000; Std Ded: 75,000 -> Taxable: 12,00,000; Tax: ₹0
    expect(screen.getAllByText('₹12,00,000').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('₹0').length).toBeGreaterThanOrEqual(1)

    // Test "Start Over"
    await user.click(screen.getByRole('button', { name: /calculate again/i }))
    expect(screen.getByRole('heading', { name: /select.*year/i })).toBeInTheDocument()
  })

  it('calculates historical FY 2024–25 under Income-tax Act, 1961', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByLabelText(/FY 2024–25/i))
    await user.click(screen.getByLabelText(/new tax regime/i))
    await user.click(screen.getByLabelText(/salary \/ pension/i))

    const salaryInput = screen.getByLabelText(/gross annual salary/i)
    await user.type(salaryInput, '1000000')
    await user.click(screen.getByRole('button', { name: /calculate tax/i }))

    expect(screen.getByRole('heading', { name: /tax estimate results/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Income-tax Act, 1961/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('₹9,25,000').length).toBeGreaterThanOrEqual(1)
  })

  it('withholds calculation and explains limitation when Non-Resident status is selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Select Non-Resident
    const nriRadio = screen.getByLabelText(/non-resident \(nri\)/i)
    await user.click(nriRadio)

    // Verify warning is displayed and calculation is withheld
    expect(screen.getByText(/unsupported taxpayer scenario — calculation withheld/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()

    // Can switch back
    await user.click(screen.getByRole('button', { name: /switch to resident individual/i }))
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('withholds calculation and explains limitation when unsupported income stream is chosen', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Navigate to Income Type Step
    await user.click(screen.getByLabelText(/FY 2024–25/i))
    await user.click(screen.getByLabelText(/new tax regime/i))

    // Select Unsupported Income option
    await user.click(screen.getByLabelText(/other income streams/i))

    // Verify warning is displayed and calculation is withheld
    expect(screen.getByText(/unsupported income stream — calculation withheld/i)).toBeInTheDocument()
    expect(screen.getByText(/Capital Gains:/i)).toBeInTheDocument()
    expect(screen.getByText(/Short-Term.*require special tax rates/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^continue/i })).not.toBeInTheDocument()
  })

  it('allows going back through steps', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByLabelText(/FY 2025–26/i))
    expect(screen.getByRole('heading', { name: /select tax regime/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('heading', { name: /select.*year/i })).toBeInTheDocument()
  })
})
