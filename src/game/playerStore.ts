import { ref } from 'vue'
import defaultSave from '../data/player-default.json'
import type { LocationKey, PlayerSave } from '../types/game'
import { locationKey } from '../types/game'

/** Incrémenté à chaque changement de PV / reset — réactivité UI. */
export const playerRevision = ref(0)

function bumpPlayer(): void {
  playerRevision.value += 1
}

function ensureDialoguePicks(): Record<string, string[]> {
  if (!player.dialoguePicks) {
    player.dialoguePicks = {}
  }
  return player.dialoguePicks as Record<string, string[]>
}

const STORAGE_KEY = 'tales-of-aroden-save'

let player: PlayerSave = structuredClone(defaultSave) as PlayerSave

export function getPlayer(): Readonly<PlayerSave> {
  return player
}

export function loadPlayer(): void {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    player = structuredClone(defaultSave) as PlayerSave
    return
  }
  try {
    player = JSON.parse(raw) as PlayerSave
    if (!player.dialoguePicks) player.dialoguePicks = {}
  } catch {
    player = structuredClone(defaultSave) as PlayerSave
  }
}

export function addDialoguePick(locKey: LocationKey, choiceId: string): void {
  const picks = ensureDialoguePicks()
  const current = picks[locKey] ?? []
  if (current.includes(choiceId)) return
  picks[locKey] = [...current, choiceId]
  savePlayer()
}

export function savePlayer(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player, null, 2))
}

export function resetPlayer(): void {
  player = structuredClone(defaultSave) as PlayerSave
  savePlayer()
  bumpPlayer()
}

export function hasFlag(flag: string): boolean {
  return player.flags.includes(flag)
}

export function addFlag(flag: string): void {
  if (hasFlag(flag)) return
  player.flags.push(flag)
  savePlayer()
}

export function removeFlag(flag: string): void {
  const index = player.flags.indexOf(flag)
  if (index === -1) return
  player.flags.splice(index, 1)
  savePlayer()
}

export function isExplored(zoneId: string, subZoneId: string): boolean {
  const key = locationKey(zoneId, subZoneId)
  return player.exploredSubZones.includes(key)
}

export function markExplored(zoneId: string, subZoneId: string): void {
  const key = locationKey(zoneId, subZoneId)
  if (player.exploredSubZones.includes(key)) return
  player.exploredSubZones.push(key)
  savePlayer()
}

export function setLocation(zoneId: string, subZoneId: string): void {
  player.currentZoneId = zoneId
  player.currentSubZoneId = subZoneId
  markExplored(zoneId, subZoneId)
  savePlayer()
}

export function applyDamage(amount: number): void {
  player.hp = Math.max(0, player.hp - amount)
  savePlayer()
  bumpPlayer()
}

export function setHp(hp: number): void {
  player.hp = Math.min(player.maxHp, Math.max(0, hp))
  savePlayer()
  bumpPlayer()
}

export function isPlayerDead(): boolean {
  return player.hp <= 0
}

export function getExploredInZone(zoneId: string): LocationKey[] {
  const prefix = `${zoneId}/`
  return player.exploredSubZones.filter((key) => key.startsWith(prefix))
}
