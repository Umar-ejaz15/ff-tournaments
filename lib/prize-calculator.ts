/**
 * Prize Calculator - Implements the FINAL TOURNAMENT & REWARD PLAN
 * 
 * Prize Pool Structure:
 * - BR Solo: Top 1 = 2500, Top 2 = 1500, Top 3 = 1000
 * - BR Duo: Top 1 = 3200, Top 2 = 1800, Top 3 = 1200
 * - BR Squad: Top 1 = 3500, Top 2 = 2000, Top 3 = 1500
 */

export type GameMode = "Solo" | "Duo" | "Squad";
export type GameType = "BR" | "CS";
export type Placement = 1 | 2 | 3;

interface PrizeStructure {
  [key: string]: {
    1: number; // Top 1
    2: number; // Top 2
    3: number; // Top 3
  };
}

const PRIZE_STRUCTURE: PrizeStructure = {
  "BR-Solo": {
    1: 2500,
    2: 1500,
    3: 1000,
  },
  "BR-Duo": {
    1: 3200,
    2: 1800,
    3: 1200,
  },
  "BR-Squad": {
    1: 3500,
    2: 2000,
    3: 1500,
  },
  // Clash Squad (Coming Soon - using same structure for now)
  "CS-Solo": {
    1: 2500,
    2: 1500,
    3: 1000,
  },
  "CS-Duo": {
    1: 3200,
    2: 1800,
    3: 1200,
  },
  "CS-Squad": {
    1: 3500,
    2: 2000,
    3: 1500,
  },
};

/**
 * Calculate reward coins based on tournament mode, game type, and placement
 */
export function calculatePrizeReward(
  mode: GameMode,
  gameType: GameType,
  placement: Placement
): number {
  const key = `${gameType}-${mode}`;
  const structure = PRIZE_STRUCTURE[key];
  
  if (!structure) {
    console.warn(`No prize structure found for ${key}, using default`);
    // Fallback: return 0 or a default value
    return 0;
  }
  
  return structure[placement] || 0;
}

/**
 * Get total prize pool for a tournament
 */
export function getTotalPrizePool(mode: GameMode, gameType: GameType): number {
  const key = `${gameType}-${mode}`;
  const structure = PRIZE_STRUCTURE[key];
  
  if (!structure) {
    return 0;
  }
  
  // Total = Top 1 + Top 2 + Top 3
  return structure[1] + structure[2] + structure[3];
}

/**
 * Get all available placements for a tournament
 */
export function getAvailablePlacements(): Placement[] {
  return [1, 2, 3];
}

