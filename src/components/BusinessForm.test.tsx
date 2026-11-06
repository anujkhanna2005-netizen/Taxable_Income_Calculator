import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BusinessForm from './BusinessForm'

describe('BusinessForm - New Regime', () => {
  it('renders net profit field with clear explanation', () => {
    render(<BusinessForm regime="new" onSubmit={() => {}} onBack={() => {}} />)
    expect(screen.getByLabelText(/net taxable business/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your turnover or gross receipts/i)).toBeInTheDocument()
  })

  it('shows no standard deduction warning for business income', () => {
    render(<BusinessForm regime="new" onSubmit={() => {}} onBack={() => {}} />)
    expect(screen.getByText(/does not apply to business income/i)).toBeInTheDocument()
  })

  it('validates empty or invalid input', async () => {
    const user = userEvent.setup()
    render(<BusinessForm regime="new" onSubmit={() => {}} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    expect(screen.getByText(/please enter a valid net taxable profit/i)).toBeInTheDocument()
  })

  it('submits valid business profit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BusinessForm regime="new" onSubmit={onSubmit} onBack={() => {}} />)

    const profitInput = screen.getByLabelText(/net taxable business/i)
    await user.type(profitInput, '800000')
    await user.click(screen.getByRole('button', { name: /calculate/i }))

    expect(onSubmit).toHaveBeenCalledOnce()
    const [ageCategory, inputs] = onSubmit.mock.calls[0]
    expect(ageCategory).toBe('below60')
    expect(inputs.netProfitBeforeTax).toBe(800_000)
  })
})

describe('BusinessForm - Old Regime', () => {
  it('shows Chapter VI-A deductions in old regime and omits generic other deductions', () => {
    render(<BusinessForm regime="old" onSubmit={() => {}} onBack={() => {}} />)
    expect(screen.getByLabelText(/section 80c/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/80d.*self.*family/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/other chapter vi-a/i)).not.toBeInTheDocument()
  })
})
