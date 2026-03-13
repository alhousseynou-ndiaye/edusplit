export const BUSINESS_RULES = {
  currency: "XOF",
  minApplicantAge: 18,
  minDownPaymentRate: 0.3,
  preferredDownPaymentRate: 0.4,
  maxInitialFinancedAmount: 150_000,
  minProductPrice: 180_000,
  maxProductPrice: 350_000,
  minInstallments: 2,
  maxInstallments: 4,
} as const;