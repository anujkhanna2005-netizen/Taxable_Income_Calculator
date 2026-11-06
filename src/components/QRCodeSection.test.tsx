import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QRCodeSection from './QRCodeSection'

describe('QRCodeSection Component', () => {
  it('renders Share button', () => {
    render(<QRCodeSection />)
    expect(screen.getByRole('button', { name: /share.*qr code/i })).toBeInTheDocument()
  })

  it('shows production setup notice and does not render QR image when VITE_APP_URL is placeholder', async () => {
    const user = userEvent.setup()
    render(<QRCodeSection appUrl="https://your-deployment-url.com" />)

    const toggleBtn = screen.getByRole('button', { name: /share.*qr code/i })
    await user.click(toggleBtn)

    expect(screen.getByText(/production qr code setup required/i)).toBeInTheDocument()
    expect(screen.getByText(/VITE_APP_URL=https:\/\/your-production-domain\.com/i)).toBeInTheDocument()
    expect(screen.queryByAltText(/qr code linking to/i)).not.toBeInTheDocument()
  })

  it('rejects unencrypted HTTP URLs', async () => {
    const user = userEvent.setup()
    render(<QRCodeSection appUrl="http://my-tax-calc.com" />)

    await user.click(screen.getByRole('button', { name: /share.*qr code/i }))
    expect(screen.getByText(/production qr code setup required/i)).toBeInTheDocument()
    expect(screen.queryByAltText(/qr code linking to/i)).not.toBeInTheDocument()
  })

  it('rejects localhost URLs even if https', async () => {
    const user = userEvent.setup()
    render(<QRCodeSection appUrl="https://localhost:5173" />)

    await user.click(screen.getByRole('button', { name: /share.*qr code/i }))
    expect(screen.getByText(/production qr code setup required/i)).toBeInTheDocument()
    expect(screen.queryByAltText(/qr code linking to/i)).not.toBeInTheDocument()
  })

  it('rejects 127.0.0.1 loopback URLs even if https', async () => {
    const user = userEvent.setup()
    render(<QRCodeSection appUrl="https://127.0.0.1:8080" />)

    await user.click(screen.getByRole('button', { name: /share.*qr code/i }))
    expect(screen.getByText(/production qr code setup required/i)).toBeInTheDocument()
    expect(screen.queryByAltText(/qr code linking to/i)).not.toBeInTheDocument()
  })

  it('renders QR code and sharing controls when configured with valid public HTTPS URL', async () => {
    const user = userEvent.setup()
    const validUrl = 'https://tax-calculator.example.com'
    render(<QRCodeSection appUrl={validUrl} />)

    await user.click(screen.getByRole('button', { name: /share.*qr code/i }))

    await waitFor(() => {
      const qrImg = screen.getByAltText(new RegExp(`qr code linking to ${validUrl}`, 'i'))
      expect(qrImg).toBeInTheDocument()
      expect(qrImg).toHaveAttribute('src', expect.stringMatching(/^data:image\/png;base64,/))
    })

    expect(screen.getByRole('button', { name: /download qr png/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(validUrl) })).toBeInTheDocument()
  })

  it('copies production link to clipboard when Copy Link is clicked', async () => {
    const user = userEvent.setup()
    const validUrl = 'https://tax-calculator.example.com'
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    })

    render(<QRCodeSection appUrl={validUrl} />)
    await user.click(screen.getByRole('button', { name: /share.*qr code/i }))

    const copyBtn = await screen.findByRole('button', { name: /copy link/i })
    await user.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledWith(validUrl)
    expect(screen.getByText(/link copied/i)).toBeInTheDocument()
  })
})
