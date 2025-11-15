/**
 * Prize Pool Distribution System
 * Calculates prize distribution based on actual prize pool amount
 * Uses percentage-based distribution for Top 1, 2, 3
 */

export interface PrizeDistribution {
  top1: number;
  top2: number;
  top3: number;
  top1Percent: number;
  top2Percent: number;
  top3Percent: number;
  total: number;
}

/**
 * Calculate prize distribution based on prize pool
 * Distribution:
 * - Top 1: 55% of prize pool
 * - Top 2: 30% of prize pool
 * - Top 3: 15% of prize pool
 */
export function calculatePrizeDistribution(prizePool: number): PrizeDistribution {
  if (prizePool <= 0) {
    return {
      top1: 0,
      top2: 0,
      top3: 0,
      top1Percent: 0,
      top2Percent: 0,
      top3Percent: 0,
      total: 0,
    };
  }

  // Percentage distribution
  const top1Percent = 55; // 55% to Top 1
  const top2Percent = 30; // 30% to Top 2
  const top3Percent = 15; // 15% to Top 3

  // Calculate amounts
  const top1 = Math.floor((prizePool * top1Percent) / 100);
  const top2 = Math.floor((prizePool * top2Percent) / 100);
  const top3 = prizePool - top1 - top2; // Remaining to ensure total matches

  return {
    top1,
    top2,
    top3,
    top1Percent,
    top2Percent,
    top3Percent,
    total: prizePool,
  };
}

/**
 * Get prize for a specific placement based on prize pool
 */
export function getPrizeForPlacement(prizePool: number, placement: 1 | 2 | 3): number {
  const distribution = calculatePrizeDistribution(prizePool);
  
  switch (placement) {
    case 1:
      return distribution.top1;
    case 2:
      return distribution.top2;
    case 3:
      return distribution.top3;
    default:
      return 0;
  }
}

/**
 * Format prize distribution for display
 */
export function formatPrizeDistribution(distribution: PrizeDistribution): string {
  return `Top 1: ${distribution.top1} (${distribution.top1Percent}%) | Top 2: ${distribution.top2} (${distribution.top2Percent}%) | Top 3: ${distribution.top3} (${distribution.top3Percent}%)`;
}

