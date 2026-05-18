export const DICE_COUNT = 5
export const MAX_REROLLS = 2

export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1
}

export function rollDice(count = DICE_COUNT): number[] {
  return Array.from({ length: count }, () => rollDie())
}

export function countFaces(dice: number[]): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const value of dice) {
    counts[value] = (counts[value] ?? 0) + 1
  }
  return counts
}
