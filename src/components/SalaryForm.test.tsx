import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SalaryForm from './SalaryForm'

describe('SalaryForm - New Regime', () => {
  it('renders gross salary field', () => {
    render(<SalaryForm regime="new" onSubmit={() => {}} onBack={() => {}} />)
    expect(screen.getByLabelText(/gross annual salary/i)).toBeInTheDocument()
  })

  it('renders age category radio buttons', () => {
    render(<SalaryForm regime="new" onSubmit={() => {}} onBack={() => {}} />)
    expect(screen.getByLabelText(/below 60/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^60[–-]79/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^80\+/i)).toBeInTheDocument()
  })

  it('does NOT show 80C/80D fields in new regime', () => {
    render(<SalaryForm regime="new" onSubmit={() => {}} onBack={() => {}} />)
    expect(screen.queryByLabelText(/section 80c/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/80d/i)).not.toBeInTheDocument()
  })

  it('shows standard deduction callout', () => {
    render(<SalaryForm regime="new" onSubmit={() => {}} onBack={() => {}} />)
    expect(screen.getByText(/Standard deduction of/i)).toHaveTextContent('₹75,000')
  })

  it('shows validation error when salary is empty and form is submitted', async () => {
    const user = userEvent.setup()
    render(<SalaryForm regime="new" onSubmit={() => {}} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    expect(screen.getByText(/valid annual salary/i)).toBeInTheDocument()
  })

  it('calls onBack when Back button is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<SalaryForm regime="new" onSubmit={() => {}} onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})

describe('SalaryForm - Old Regime', () => {
  it('shows verified 80C and 80D deduction fields and omits generic other deductions', () => {
    render(<SalaryForm regime="old" onSubmit={() => {}} onBack={() => {}} />)
    expect(screen.getByLabelText(/section 80c/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/80d.*self.*spouse/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/80d.*parents/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/other chapter vi-a/i)).not.toBeInTheDocument()
  })

  it('shows ₹50,000 standard deduction callout in old regime', () => {
    render(<SalaryForm regime="old" onSubmit={() => {}} onBack={() => {}} />)
    expect(screen.getByText(/Standard deduction of/i)).toHaveTextContent('₹50,000')
  })

  it('calls onSubmit with correct data when form is submitted', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SalaryForm regime="new" onSubmit={onSubmit} onBack={() => {}} />)

    const salaryInput = screen.getByLabelText(/gross annual salary/i)
    await user.type(salaryInput, '1000000')
    await user.click(screen.getByRole('button', { name: /calculate/i }))

    expect(onSubmit).toHaveBeenCalledOnce()
    const [ageCategory, inputs] = onSubmit.mock.calls[0]
    expect(ageCategory).toBe('below60')
    expect(inputs.grossSalary).toBe(1_000_000)
  })
})
