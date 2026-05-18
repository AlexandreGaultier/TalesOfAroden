import type { CombatAbility, DicePattern } from '../types/combat'
import { countSymbolsFromDice, type DieSymbol } from './symbols'

export function patternMatches(dice: number[], pattern: DicePattern): boolean {
  const counts = countSymbolsFromDice(dice)
  for (const sym of Object.keys(pattern) as DieSymbol[]) {
    const needed = pattern[sym] ?? 0
    if (needed > 0 && counts[sym] < needed) return false
  }
  return true
}

export function findMatchingAbilities(
  dice: number[],
  abilities: CombatAbility[],
): CombatAbility[] {
  return abilities
    .filter((a) => patternMatches(dice, a.pattern))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
}

export function pickBestAbility(
  dice: number[],
  abilities: CombatAbility[],
): CombatAbility | null {
  const matches = findMatchingAbilities(dice, abilities)
  return matches[0] ?? null
}
