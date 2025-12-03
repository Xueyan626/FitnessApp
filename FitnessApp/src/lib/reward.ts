// src/lib/reward.ts

export type TierInfo = {
  name: "Bronze" | "Silver" | "Gold";
  emoji: string;
  min: number;
  max: number | null; // null means no upper limit
};

export const TIERS: TierInfo[] = [
  { name: "Bronze", emoji: "🥉", min: 0,   max: 199 },
  { name: "Silver", emoji: "🥈", min: 200, max: 499 },
  { name: "Gold",   emoji: "🥇", min: 500, max: null },
];

/**
 * Returns the tier based on given points.
 */
export function getTier(points: number): TierInfo {
  return (
    TIERS.find((tier) => {
      if (tier.max === null) return points >= tier.min; // gold tier
      return points >= tier.min && points <= tier.max;
    }) || TIERS[0]
  );
}

/**
 * Returns the next tier (if exists), otherwise null.
 */
export function getNextTier(points: number): TierInfo | null {
  const current = getTier(points);
  const idx = TIERS.findIndex((t) => t.name === current.name);
  return TIERS[idx + 1] || null;
}

/**
 * Returns how many points are needed to reach next tier.
 * If no next tier, returns null.
 */
export function getPointsToNextTier(points: number): number | null {
  const next = getNextTier(points);
  if (!next) return null;
  return Math.max(0, next.min - points);
}

/**
 * Returns progress percentage within current tier (0-100).
 */
export function getTierProgress(points: number): number {
  const current = getTier(points);
  const next = getNextTier(points);
  if (!next) return 100; // already at top tier

  const range = (next.min - current.min) || 1;
  const progress = ((points - current.min) / range) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}