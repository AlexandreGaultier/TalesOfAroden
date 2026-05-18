import { ref, computed } from 'vue'
import type { GameZone, SubZone } from '../types/game'
import { isCombatContent } from '../types/game'
import {
  clearRollState,
  getRollState,
  hasCombatRoll,
  hasVigilanceRoll,
  resetAllRollStates,
  setRematchTriggered,
  setVigilanceRoll,
  type StoredRoll,
} from './actionRollState'
import {
  canLeaveCombatSubZone,
  clearCombatVisitSafe,
  getCombatContent,
  isCombatCleared,
  isCombatVisitSafe,
  resetAllCombatVisits,
  setCombatVisitSafe,
} from './combatState'
import { isDialogueComplete } from './dialogueState'
import { closeCombat, isCombatOpen, startCombatFromZone } from '../combat/combatStore'
import { checkCombatRematch } from './encounters'
import {
  getPlayer,
  hasFlag,
  isExplored,
  loadPlayer,
  playerRevision,
  resetPlayer,
  setLocation,
} from './playerStore'
import { areNeighbors, getNeighbors, getSubZone, getZone } from './zoneRegistry'

import { addJournal, clearJournal as resetJournal, journal } from './journal'

export { journal }
export const playerVersion = ref(0)
export const activeModal = ref<'none' | 'player' | 'journal' | 'subzone'>('none')
export const modalSubZoneId = ref<string | null>(null)

function bump(): void {
  playerVersion.value += 1
}

export function notifyPlayerUpdate(): void {
  bump()
}

export { addJournal }

export function initSession(): void {
  loadPlayer()
  bump()
}

export const currentZone = computed((): GameZone | undefined => {
  playerVersion.value
  return getZone(getPlayer().currentZoneId)
})

export const currentSubZone = computed((): SubZone | undefined => {
  playerVersion.value
  const p = getPlayer()
  return getSubZone(p.currentZoneId, p.currentSubZoneId)
})

export const modalSubZone = computed((): SubZone | undefined => {
  playerVersion.value
  if (!modalSubZoneId.value) return undefined
  const p = getPlayer()
  return getSubZone(p.currentZoneId, modalSubZoneId.value)
})

export const mapSubZones = computed((): SubZone[] => {
  playerVersion.value
  const zone = currentZone.value
  if (!zone) return []
  return zone.subZones.filter((sz) => isExplored(zone.id, sz.id))
})

export function openPlayerModal(): void {
  activeModal.value = 'player'
}

export function openJournalModal(): void {
  activeModal.value = 'journal'
}

export function openSubZoneModal(subZoneId: string): void {
  if (!isExplored(getPlayer().currentZoneId, subZoneId)) return
  modalSubZoneId.value = subZoneId
  activeModal.value = 'subzone'
}

export function closeModal(): void {
  activeModal.value = 'none'
  modalSubZoneId.value = null
}

export function isAtLocation(subZoneId: string): boolean {
  return getPlayer().currentSubZoneId === subZoneId
}

export function canTravelTo(targetSubZoneId: string): boolean {
  const p = getPlayer()
  if (isAtLocation(targetSubZoneId)) return false
  return areNeighbors(p.currentZoneId, p.currentSubZoneId, targetSubZoneId)
}

export function canShowPathsInModal(subZoneId: string): boolean {
  if (!isAtLocation(subZoneId)) return false
  const p = getPlayer()
  const sz = getSubZone(p.currentZoneId, subZoneId)
  if (!sz) return false
  if (sz.type === 'combat') return canLeaveCombatSubZone(subZoneId)
  if (sz.type === 'dialogue') {
    return isDialogueComplete(p.currentZoneId, subZoneId)
  }
  return true
}

export function needsRematchCheck(subZoneId: string): boolean {
  if (!isAtLocation(subZoneId)) return false
  const content = getCombatContent(getPlayer().currentZoneId, subZoneId)
  if (!content) return false
  if (!isCombatCleared(subZoneId)) return false
  if (hasVigilanceRoll(subZoneId)) return false
  return !isCombatVisitSafe(subZoneId)
}

/** Lieux voisins accessibles depuis la position actuelle (chemins débloqués). */
export function getReachableDestinationIds(): string[] {
  const currentId = getPlayer().currentSubZoneId
  if (!canShowPathsInModal(currentId)) return []
  return getTravelOptions(currentId).map((opt) => opt.target.id)
}

export const reachableSubZoneIds = computed((): Set<string> => {
  playerVersion.value
  return new Set(getReachableDestinationIds())
})

export const isPlayerDead = computed((): boolean => {
  playerVersion.value
  playerRevision.value
  return getPlayer().hp <= 0
})

export function getTravelOptions(fromSubZoneId: string) {
  const p = getPlayer()
  const from = getSubZone(p.currentZoneId, fromSubZoneId)
  if (!from) return []

  return getNeighbors(p.currentZoneId, fromSubZoneId).map((target) => {
    const forward = from.connections.find((c) => c.targetId === target.id)
    const explored = isExplored(p.currentZoneId, target.id)
    return {
      target,
      travelLabel: forward?.travelLabel ?? `Vers ${target.name}`,
      explored,
    }
  })
}

export function travelTo(targetSubZoneId: string): void {
  const p = getPlayer()
  if (!canTravelTo(targetSubZoneId)) return

  const target = getSubZone(p.currentZoneId, targetSubZoneId)
  if (!target) return

  const fromId = p.currentSubZoneId
  clearCombatVisitSafe(fromId)
  clearRollState(fromId)

  setLocation(p.currentZoneId, targetSubZoneId)
  addJournal([`→ Vous rejoignez ${target.name}.`])
  bump()
  closeModal()
}

export function goToSubZone(targetSubZoneId: string): void {
  if (!canTravelTo(targetSubZoneId)) return
  travelTo(targetSubZoneId)
}

export function runRematchCheck(subZoneId: string, d20?: number): StoredRoll {
  const p = getPlayer()
  const empty: StoredRoll = { kind: 'vigilance', value: 0, lines: [] }

  if (!isAtLocation(subZoneId)) return empty

  const content = getCombatContent(p.currentZoneId, subZoneId)
  if (!content) return empty

  const result = checkCombatRematch(content, d20)
  addJournal(result.lines)

  const stored: StoredRoll = {
    kind: 'vigilance',
    value: result.roll,
    lines: result.lines,
    won: !result.triggered,
  }
  setVigilanceRoll(subZoneId, stored)

  if (result.triggered) {
    setCombatVisitSafe(subZoneId, false)
    setRematchTriggered(subZoneId, true)
    startCombatFromZone(content, p.currentZoneId, subZoneId, true)
  } else {
    setCombatVisitSafe(subZoneId, true)
    setRematchTriggered(subZoneId, false)
  }

  bump()
  return stored
}

export function tryUseExit(subZoneId: string): string[] {
  const p = getPlayer()
  if (!isAtLocation(subZoneId)) {
    return ['Vous devez être sur place pour emprunter cette sortie.']
  }

  const subZone = getSubZone(p.currentZoneId, subZoneId)
  if (!subZone || subZone.type !== 'exit') return []

  const content = subZone.content
  if (!('targetZoneId' in content)) return []

  if (content.requiredFlag && !hasFlag(content.requiredFlag)) {
    const lines = [
      `Passage vers ${content.targetZoneName} bloqué.`,
      `Requis : ${content.requiredFlag}`,
    ]
    addJournal(lines)
    return lines
  }

  const lines = [
    `Vous prenez la route vers ${content.targetZoneName}.`,
    '(Changement de zone — prochaine étape.)',
  ]
  addJournal(lines)
  return lines
}

export function clearJournal(): void {
  resetJournal()
}

export function restartGame(): void {
  closeCombat()
  resetPlayer()
  resetAllCombatVisits()
  resetAllRollStates()
  resetJournal()
  closeModal()
  bump()
}

export function engageDiceCombat(
  subZoneId: string,
  isRematch: boolean,
): boolean {
  const p = getPlayer()
  const content = getCombatContent(p.currentZoneId, subZoneId)
  if (!content || !isAtLocation(subZoneId)) return false
  return startCombatFromZone(content, p.currentZoneId, subZoneId, isRematch)
}

export {
  getRollState,
  hasCombatRoll,
  hasVigilanceRoll,
  isCombatCleared,
  isCombatContent,
  isCombatOpen,
}
