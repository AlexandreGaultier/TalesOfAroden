import type { CombatContent } from '../types/game'
import { addFlag, applyDamage, hasFlag, removeFlag } from './playerStore'

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

export interface CombatResolveResult {
  roll: number
  won: boolean
  lines: string[]
}

export function resolveCombat(
  content: CombatContent,
  isRematch: boolean,
  forcedRoll?: number,
): CombatResolveResult {
  const roll = forcedRoll ?? rollDie(6)
  const lines: string[] = []
  const title = isRematch ? content.rematchTitle : content.title

  lines.push(`⚔ ${title}`)
  lines.push(`Jet de survie (1d6) : ${roll}`)

  if (roll === 1) {
    applyDamage(3)
    lines.push(
      content.combatLoseText ??
        'Malchance ! Vous perdez 3 points de vie.',
    )
    return { roll, won: false, lines }
  }

  lines.push(
    content.combatWinText ?? 'Vous triomphez de la menace.',
  )
  if (!hasFlag(content.victoryFlag)) {
    addFlag(content.victoryFlag)
  }
  return { roll, won: true, lines }
}

export interface RematchCheckResult {
  roll: number
  triggered: boolean
  threshold: number
  lines: string[]
}

export function checkCombatRematch(
  content: CombatContent,
  forcedRoll?: number,
): RematchCheckResult {
  const threshold = content.rematchThreshold ?? 4
  const roll = forcedRoll ?? rollDie(20)
  const lines: string[] = [`Jet de vigilance (1d20) : ${roll} (seuil ${threshold})`]

  if (roll <= threshold) {
    removeFlag(content.victoryFlag)
    lines.push(content.vigilanceDangerText)
    lines.push(`⚠ ${content.rematchTitle}`)
    return { roll, triggered: true, threshold, lines }
  }

  lines.push(content.vigilanceSafeText)
  return { roll, triggered: false, threshold, lines }
}
