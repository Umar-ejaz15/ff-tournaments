/**
 * Prize Calculator - Dynamic Prize Pool Distribution
 * 
 * Uses percentage-based distribution based on actual prize pool:
 * - Top 1: 55% of prize pool
 * - Top 2: 30% of prize pool
 * - Top 3: 15% of prize pool
 */

import { getPrizeForPlacement } from "./prize-distribution";

export type GameMode = "Solo" | "Duo" | "Squad";
export type GameType = "BR" | "CS";
export type Placement = 1 | 2 | 3;

/**
 * Calculate reward coins based on actual prize pool and placement
 * This uses dynamic percentage-based distribution
 */
export function calculatePrizeReward(
  prizePool: number,
  placement: Placement
): number {
  return getPrizeForPlacement(prizePool, placement);
}

/**
 * Get total prize pool (returns the provided prize pool)
 * This function is kept for backward compatibility
 */
export function getTotalPrizePool(mode: GameMode, gameType: GameType): number {
  // This is now deprecated - prize pool comes from tournament data
  // Keeping for backward compatibility but returning 0
  return 0;
}

/**
 * Get all available placements for a tournament
 */
export function getAvailablePlacements(): Placement[] {
  return [1, 2, 3];
}

