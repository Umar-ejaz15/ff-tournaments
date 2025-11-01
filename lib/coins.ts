export const COINS_PER_PKR = 50 / 200; // 0.25
export function pkrToCoins(pkr: number) {
  if (pkr <= 0) return 0;
  return Math.floor(pkr * COINS_PER_PKR);
}
