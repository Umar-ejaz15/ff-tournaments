/**
 * Payment Configuration
 * Bank account details for transaction proof
 */

export const PAYMENT_METHODS = {
  NayaPay: {
    accountNumber: "03367392390",
    name: "NayaPay",
  },
  EasyPaisa: {
    accountNumber: "03367392390",
    name: "EasyPaisa",
  },
  JazzCash: {
    accountNumber: "03367392390",
    name: "JazzCash",
  },
  // Removed JazzCash and Bank - only EasyPaisa and NayaPay are supported now
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

/**
 * Get account number for a payment method
 */
export function getAccountNumber(method: PaymentMethod): string {
  return PAYMENT_METHODS[method].accountNumber;
}

/**
 * Get all payment methods with account details
 */
export function getAllPaymentMethods() {
  return Object.entries(PAYMENT_METHODS).map(([key, value]) => ({
    method: key as PaymentMethod,
    accountNumber: value.accountNumber,
    name: value.name,
  }));
}

