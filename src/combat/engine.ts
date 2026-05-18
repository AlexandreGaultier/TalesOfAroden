import type {
  CombatAbility,
  CombatSession,
  CombatantDef,
  DieSymbol,
  FighterState,
} from '../types/combat'
import { DICE_COUNT, MAX_REROLLS, rollDie, rollDice } from './dice'
import { findMatchingAbilities, pickBestAbility } from './patterns'
import { faceToSymbol } from './symbols'

export const INITIATIVE_DURATION_MS = 5000

export function createFighter(def: CombatantDef, hp?: number): FighterState {
  return {
    defId: def.id,
    name: def.name,
    hp: hp ?? def.maxHp,
    maxHp: def.maxHp,
  }
}

export function rollInitiativeD20(): { hero: number; enemy: number } {
  return {
    hero: Math.floor(Math.random() * 20) + 1,
    enemy: Math.floor(Math.random() * 20) + 1,
  }
}

export function resolveFirstAttacker(
  init: { hero: number; enemy: number },
): 'hero' | 'enemy' {
  if (init.hero >= init.enemy) return 'hero'
  return 'enemy'
}

export function startPlayerRoll(): Pick<
  CombatSession,
  'dice' | 'toReroll' | 'rerollsLeft'
> {
  return {
    dice: rollDice(DICE_COUNT),
    toReroll: Array(DICE_COUNT).fill(false),
    rerollsLeft: MAX_REROLLS,
  }
}

/** Relance uniquement les dés marqués (toReroll). */
export function rerollSelectedDice(session: CombatSession): number[] {
  const next = [...session.dice]
  for (let i = 0; i < DICE_COUNT; i++) {
    if (session.toReroll[i]) next[i] = rollDie()
  }
  return next
}

export function applyDamage(
  target: FighterState,
  amount: number,
): FighterState {
  return { ...target, hp: Math.max(0, target.hp - amount) }
}

export function getMatchingForSide(
  session: CombatSession,
  abilities: CombatAbility[],
): CombatAbility[] {
  return findMatchingAbilities(session.dice, abilities)
}

function indicesForSymbol(
  dice: number[],
  symbol: DieSymbol,
  need: number,
): Set<number> {
  const kept = new Set<number>()
  let count = 0
  for (let i = 0; i < dice.length && count < need; i++) {
    if (faceToSymbol(dice[i]) === symbol && !kept.has(i)) {
      kept.add(i)
      count += 1
    }
  }
  return kept
}

/** IA : relance les dés qui ne servent pas la meilleure capacité actuelle. */
export function enemyRerollStrategy(
  dice: number[],
  abilities: CombatAbility[],
  rerollsLeft: number,
): number[] {
  let current = [...dice]
  let left = rerollsLeft

  while (left > 0) {
    const best = pickBestAbility(current, abilities)
    if (!best) {
      current = current.map(() => rollDie())
      left -= 1
      continue
    }

    const toKeep = new Set<number>()
    for (const [sym, need] of Object.entries(best.pattern) as [
      DieSymbol,
      number,
    ][]) {
      if (!need) continue
      const indices = indicesForSymbol(current, sym, need)
      indices.forEach((i) => toKeep.add(i))
    }

    let changed = false
    for (let i = 0; i < current.length; i++) {
      if (!toKeep.has(i)) {
        current[i] = rollDie()
        changed = true
      }
    }
    if (!changed) break
    left -= 1
  }

  return current
}

export function runEnemyTurn(
  enemyDef: CombatantDef,
): { dice: number[]; ability: CombatAbility | null } {
  let dice = rollDice(DICE_COUNT)
  dice = enemyRerollStrategy(dice, enemyDef.abilities, MAX_REROLLS)
  const ability = pickBestAbility(dice, enemyDef.abilities)
  return { dice, ability }
}
