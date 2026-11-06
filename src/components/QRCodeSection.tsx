import { useState } from 'react'
import QRCode from 'qrcode'

const PLACEHOLDER = 'https://your-deployment-url.com'

interface QRCodeSectionProps {
  appUrl?: string
}

export default function QRCodeSection({ appUrl: propUrl }: QRCodeSectionProps = {}) {
  const APP_URL = (propUrl ?? import.meta.env.VITE_APP_URL as string | undefined)?.trim()
  const [showQR, setShowQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Strictly check that APP_URL is a configured HTTPS production URL
  const isProductionUrl =
    Boolean(APP_URL) &&
    APP_URL !== PLACEHOLDER &&
    !APP_URL?.includes('localhost') &&
    !APP_URL?.includes('127.0.0.1') &&
    APP_URL?.startsWith('https://')

  async function handleToggleQR() {
    if (showQR) {
      setShowQR(false)
      return
    }

    if (!isProductionUrl) {
      setShowQR(true)
      return
    }

    setGenerating(true)
    try {
      // Encode strictly the app's public HTTPS URL — never financial inputs or user results
      const dataUrl = await QRCode.toDataURL(APP_URL!, {
        width: 256,
        margin: 2,
        color: { dark: '#003366', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(dataUrl)
      setShowQR(true)
    } catch {
      // ignore
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'tax-calculator-qr.png'
    a.click()
  }

  async function handleCopyLink() {
    if (!APP_URL) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(APP_URL)
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = APP_URL
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  async function handleNativeShare() {
    if (!APP_URL) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Indian Income Tax Estimator',
          text: 'Calculate your estimated Indian income tax (Tax Year 2026–27 & Historical Years):',
          url: APP_URL,
        })
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="qr-section">
      <button
        className="btn btn-ghost btn-small"
        onClick={handleToggleQR}
        aria-expanded={showQR}
        aria-controls="qr-panel"
      >
        {showQR ? '✕ Close Share' : '📱 Share / Open via QR Code'}
      </button>

      {showQR && (
        <div id="qr-panel" className="qr-panel" role="region" aria-label="Share via QR Code">
          {!isProductionUrl ? (
            <div className="callout callout-warning">
              <strong>Production QR Code Setup Required:</strong>
              <p style={{ margin: '0.4rem 0' }}>
                To generate a production QR code that users can scan from mobile phones, configure your public HTTPS URL in <code>.env.local</code>:
              </p>
              <pre style={{ background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px', fontSize: '0.82rem' }}>
                VITE_APP_URL=https://your-production-domain.com
              </pre>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.82rem' }}>
                Localhost, HTTP, and placeholder URLs are intentionally blocked from QR encoding so users don't scan unroutable links.
              </p>
            </div>
          ) : (
            <div className="qr-content-card">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt={`QR code linking to ${APP_URL}`}
                  width={160}
                  height={160}
                  className="qr-image"
                />
              )}
              <p className="qr-url-note">
                Scan with any smartphone camera to open this calculator directly in your mobile browser:
              </p>
              <p className="qr-url">
                <a href={APP_URL} target="_blank" rel="noopener noreferrer">
                  {APP_URL} ↗
                </a>
              </p>
              <div className="qr-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                {generating && <span>Generating QR code…</span>}
                {qrDataUrl && (
                  <button className="btn btn-secondary btn-small" onClick={handleDownload}>
                    ⬇️ Download QR PNG
                  </button>
                )}
                <button className="btn btn-secondary btn-small" onClick={handleCopyLink}>
                  {copied ? '✅ Link Copied!' : '📋 Copy Link'}
                </button>
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button className="btn btn-secondary btn-small" onClick={handleNativeShare}>
                    🔗 Native Share
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
