# 🇮🇳 Indian Income Tax Calculator (Mobile-Friendly Web App)

A mobile-first, browser-based Indian income tax calculator built with **React 18 + Vite + TypeScript**. Designed to be accessed directly or launched by scanning a QR code on a smartphone.

---

## Key Highlights

- **100% Client-Side & Private:** No personal identifiers (PAN, Name, Phone, Email) collected; no financial data transmitted to servers or analytics.
- **Strict Distinction:** Computes **Estimated Taxable Income** (Gross − Deductions) and **Estimated Tax Payable** as separate, sequential steps.
- **Verified Statutory Tax Rules:**
  - **Tax Year 2026–27 (AY 2027–28)**: Modernized architecture under the **Income-tax Act, 2025** (as amended by Finance Act 2026). Standard deduction of ₹75,000, revised slabs, Section 156 tax rebate up to ₹60,000 with statutory marginal relief.
  - **FY 2025–26 (AY 2026–27)**: Income-tax Act, 1961. Revised slabs, standard deduction of ₹75,000, Section 87A rebate up to ₹60,000 with statutory marginal relief.
  - **FY 2024–25 (AY 2025–26)**: Historical calculation under Income-tax Act, 1961. Standard deduction of ₹75,000 (Finance (No. 2) Act, 2024), Section 87A rebate up to ₹25,000.
  - **Old Regime (Optional)**: Slabs by age (<60, 60–79, 80+), standard deduction of ₹50,000 (salary only), Section 80C (up to ₹1,50,000), Section 80D (self & parents with senior citizen logic), and rebate (up to ₹12,500).
- **Statutory Rounding Rules:**
  - Taxable Income rounded to nearest multiple of ₹10 per **Section 288A**.
  - Tax Payable rounded to nearest multiple of ₹10 per **Section 288B**.
- **Transparent Breakdown:** Displays two clear breakdown tables:
  1. *Computation of Taxable Income*
  2. *Computation of Estimated Tax Payable*
- **Production QR Code Generation:** Encodes strictly the deployed HTTPS application URL (never localhost, user income, or results).

---

## Supported & Unsupported Scope

### Supported
- **Taxpayer Status:** Individual
- **Residency:** Resident in India
- **Income Heads:**
  - Salary / Pension
  - Net Business / Professional Profit
- **Tax Years & Acts:**
  - Tax Year 2026–27 (AY 2027–28) under the Income-tax Act, 2025
  - FY 2025–26 (AY 2026–27) under the Income-tax Act, 1961
  - FY 2024–25 (AY 2025–26) under the Income-tax Act, 1961 (Historical)
- **Regimes:** New Tax Regime (default) and Old Tax Regime (optional)

### Intentionally Unsupported (Withheld from V1)
To prevent misleading estimates, the following complex tax cases are not supported and are flagged on the interface:
- Capital Gains (Short-Term u/s 111A, Long-Term u/s 112/112A)
- Income from House Property (Section 24)
- Agricultural Income (Section 10(1))
- Foreign Income / DTAA Relief (Section 90/91)
- Non-Resident (NRI) and RNOR tax calculations
- Presumptive Taxation (Section 44AD / 44ADA)
- HRA / LTA exemption calculations

---

## Local Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser or test in responsive mobile mode (DevTools `Ctrl+Shift+M`).

### 3. Run Tests
```bash
# Run all unit and integration tests
npm test

# Run tests with coverage report
npm run coverage
```

### 4. Build for Production
```bash
npm run build
```
Build output is emitted to `dist/`.

---

## QR Code & Production URL Configuration

The application includes an in-app QR code display and download feature (`src/components/QRCodeSection.tsx`).

### How to Configure:
1. Create or edit `.env.local` in the project root:
   ```env
   VITE_APP_URL=https://your-production-app.vercel.app
   ```
2. Build or restart the development server:
   ```bash
   npm run build
   ```
3. Click **📱 Share / Open via QR Code** in the header.
4. The calculator will render a QR code encoding your public HTTPS URL.
5. Click **⬇️ Download QR Code PNG** to save the image for print or posters.

*Safety Safeguard: Localhost, 127.0.0.1, and placeholder URLs are blocked from QR encoding to prevent invalid scans.*

---

## Deployment Options

### Vercel
```bash
npx vercel
```
Set `VITE_APP_URL` in the Vercel Project Settings under Environment Variables.

### Netlify
```bash
npx netlify deploy --prod --dir=dist
```
Set `VITE_APP_URL` in Netlify Site Configuration.

### GitHub Pages
Set `base: '/<repo-name>/'` in `vite.config.ts`, then:
```bash
npm run build
npx gh-pages -d dist
```

---

## Project Architecture

```
src/
├── App.tsx                     # Step wizard router & state machine
├── App.css                     # Responsive mobile-first stylesheet
├── index.css                   # Design tokens, accessibility focus rings, variables
├── components/
│   ├── TaxYearStep.tsx         # FY 2024-25 vs FY 2025-26 with AY distinctions
│   ├── RegimeStep.tsx          # New (default) vs Old regime selection
│   ├── IncomeTypeStep.tsx      # Salary vs Business + Out of scope notices
│   ├── SalaryForm.tsx          # Gross salary + Form 16 explanations + 80C/80D
│   ├── BusinessForm.tsx        # Net profit before tax (turnover excluded)
│   ├── ResultsView.tsx         # Taxable income vs Tax payable + breakdowns + disclaimer
│   └── QRCodeSection.tsx       # QR code generator & PNG download
├── tax/
│   ├── taxRules.ts             # Statutory slabs, exemptions, surcharge, cess data
│   ├── calculator.ts           # Integer tax engine & Section 288A/B rounding
│   └── calculator.test.ts      # Unit tests for tax engine
└── utils/
    ├── format.ts               # Indian Rupee (₹) formatting (en-IN)
    └── format.test.ts          # Formatter unit tests
```
