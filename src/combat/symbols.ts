import type { DieSymbol } from '../types/combat'

/** Symboles façon Dice Throne : 1–3 épée, 4–5 bouclier, 6 aura. */
export type { DieSymbol }

export const SYMBOL_ORDER: DieSymbol[] = ['sword', 'shield', 'aura']

export const FACE_TO_SYMBOL: Record<number, DieSymbol> = {
  1: 'sword',
  2: 'sword',
  3: 'sword',
  4: 'shield',
  5: 'shield',
  6: 'aura',
}

export const SYMBOL_META: Record<
  DieSymbol,
  { label: string; short: string; faces: number[] }
> = {
  sword: { label: 'Épée', short: '⚔', faces: [1, 2, 3] },
  shield: { label: 'Bouclier', short: '🛡', faces: [4, 5] },
  aura: { label: 'Aura', short: '✦', faces: [6] },
}

export type SymbolCounts = Record<DieSymbol, number>

export function faceToSymbol(face: number): DieSymbol {
  return FACE_TO_SYMBOL[face] ?? 'sword'
}

export function countSymbolsFromDice(dice: number[]): SymbolCounts {
  const counts: SymbolCounts = { sword: 0, shield: 0, aura: 0 }
  for (const face of dice) {
    counts[faceToSymbol(face)] += 1
  }
  return counts
}

export function formatDiceAsSymbols(dice: number[]): string {
  if (!dice.length) return '—'
  return dice.map((f) => SYMBOL_META[faceToSymbol(f)].short).join(' ')
}

export function formatSymbolCounts(counts: SymbolCounts): string {
  return SYMBOL_ORDER.filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]}×${SYMBOL_META[s].label}`)
    .join(' · ')
}
