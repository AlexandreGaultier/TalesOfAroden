import type { DieSymbol } from './symbols'
import { SYMBOL_META, SYMBOL_ORDER } from './symbols'
import type { DicePattern } from '../types/combat'

export function formatPatternText(pattern: DicePattern): string {
  return SYMBOL_ORDER.filter((s) => (pattern[s] ?? 0) > 0)
    .map((s) => `${pattern[s]}×${SYMBOL_META[s].label}`)
    .join(' + ')
}

export function patternToSymbolTokens(pattern: DicePattern): DieSymbol[] {
  const tokens: DieSymbol[] = []
  for (const sym of SYMBOL_ORDER) {
    const count = pattern[sym] ?? 0
    for (let i = 0; i < count; i++) tokens.push(sym)
  }
  return tokens
}
