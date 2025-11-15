/**
 * Coins Discount System
 * Provides discounts for bulk coin purchases
 */

export interface DiscountTier {
  minCoins: number;
  discountPercent: number;
  label: string;
}

export const DISCOUNT_TIERS: DiscountTier[] = [
  { minCoins: 0, discountPercent: 0, label: "No Discount" },
  { minCoins: 100, discountPercent: 10, label: "10% Discount" },
  { minCoins: 250, discountPercent: 15, label: "15% Discount" },
  { minCoins: 500, discountPercent: 20, label: "20% Discount" },
];

/**
 * Calculate discount percentage based on coin amount
 */
export function getDiscountPercent(coins: number): number {
  // Sort tiers by minCoins descending to find the highest applicable tier
  const sortedTiers = [...DISCOUNT_TIERS].sort((a, b) => b.minCoins - a.minCoins);
  
  for (const tier of sortedTiers) {
    if (coins >= tier.minCoins) {
      return tier.discountPercent;
    }
  }
  
  return 0;
}

/**
 * Calculate coins with discount applied
 */
export function calculateCoinsWithDiscount(baseCoins: number): {
  baseCoins: number;
  discountPercent: number;
  discountAmount: number;
  finalCoins: number;
} {
  const discountPercent = getDiscountPercent(baseCoins);
  const discountAmount = Math.floor((baseCoins * discountPercent) / 100);
  const finalCoins = baseCoins + discountAmount; // Discount adds bonus coins

  return {
    baseCoins,
    discountPercent,
    discountAmount,
    finalCoins,
  };
}

/**
 * Calculate PKR to Coins with discount
 */
export function pkrToCoinsWithDiscount(pkr: number): {
  baseCoins: number;
  discountPercent: number;
  discountAmount: number;
  finalCoins: number;
  pkr: number;
} {
  // Base conversion: 50 coins = Rs. 200 (1 coin = Rs. 4)
  const baseCoins = Math.floor((pkr / 200) * 50);
  const { discountPercent, discountAmount, finalCoins } = calculateCoinsWithDiscount(baseCoins);

  return {
    pkr,
    baseCoins,
    discountPercent,
    discountAmount,
    finalCoins,
  };
}

