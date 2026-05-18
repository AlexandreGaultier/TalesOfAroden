import { ref } from 'vue'
import type { CombatContent } from '../types/game'
import { hasFlag } from './playerStore'
import { getSubZone } from './zoneRegistry'
import { getPlayer } from './playerStore'

/** Zone de combat validée pour quitter le lieu (après victoire ou d20 favorable). */
const visitSafe = ref<Record<string, boolean>>({})

export function isCombatVisitSafe(subZoneId: string): boolean {
  return visitSafe.value[subZoneId] === true
}

export function setCombatVisitSafe(subZoneId: string, safe: boolean): void {
  visitSafe.value = { ...visitSafe.value, [subZoneId]: safe }
}

export function clearCombatVisitSafe(subZoneId: string): void {
  const next = { ...visitSafe.value }
  delete next[subZoneId]
  visitSafe.value = next
}

export function resetAllCombatVisits(): void {
  visitSafe.value = {}
}

export function getCombatVisitsSnapshot(): Record<string, boolean> {
  return { ...visitSafe.value }
}

export function loadCombatVisits(data: Record<string, boolean>): void {
  visitSafe.value = { ...data }
}

export function getCombatContent(
  zoneId: string,
  subZoneId: string,
): CombatContent | undefined {
  const sz = getSubZone(zoneId, subZoneId)
  if (!sz || sz.type !== 'combat') return undefined
  if (!('encounterId' in sz.content)) return undefined
  return sz.content
}

export function isCombatCleared(subZoneId: string): boolean {
  const p = getPlayer()
  const content = getCombatContent(p.currentZoneId, subZoneId)
  if (!content) return true
  return hasFlag(content.victoryFlag)
}

/** Chemins débloqués sur une sous-zone de combat (sur place uniquement). */
export function canLeaveCombatSubZone(subZoneId: string): boolean {
  const p = getPlayer()
  const sz = getSubZone(p.currentZoneId, subZoneId)
  if (!sz || sz.type !== 'combat') return true
  if (!isCombatCleared(subZoneId)) return false
  return isCombatVisitSafe(subZoneId)
}
