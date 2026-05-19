import { ref } from 'vue'
import defaultSave from '../data/player-default.json'
import type { LocationKey, PlayerSave } from '../types/game'
import { locationKey } from '../types/game'
import { persistActiveCharacter } from './saveStore'

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

function normalizePlayer(p: PlayerSave): void {
  if (typeof p.gallions !== 'number') p.gallions = 0
  if (!p.inventory || typeof p.inventory !== 'object') p.inventory = {}
}

export function getInventorySnapshot(): {
  gallions: number
  inventory: Record<string, number>
} {
  return { gallions: player.gallions, inventory: { ...player.inventory } }
}

export function addGallions(amount: number): void {
  player.gallions = Math.max(0, player.gallions + amount)
  savePlayer()
}

export function addInventoryItems(
  entries: { itemId: string; quantity: number }[],
): void {
  if (!entries.length) return
  for (const { itemId, quantity } of entries) {
    if (quantity <= 0) continue
    player.inventory[itemId] = (player.inventory[itemId] ?? 0) + quantity
  }
  savePlayer()
}

export function removeInventoryItem(itemId: string, quantity: number): boolean {
  if (quantity <= 0) return true
  const current = player.inventory[itemId] ?? 0
  if (current < quantity) return false
  const next = current - quantity
  if (next <= 0) delete player.inventory[itemId]
  else player.inventory[itemId] = next
  savePlayer()
  return true
}

export function getItemCount(itemId: string): number {
  return player.inventory[itemId] ?? 0
}

let player: PlayerSave = structuredClone(defaultSave) as PlayerSave

export function getPlayer(): Readonly<PlayerSave> {
  return player
}

export function loadPlayerData(data: PlayerSave): void {
  player = structuredClone(data) as PlayerSave
  if (!player.dialoguePicks) player.dialoguePicks = {}
  normalizePlayer(player)
  bumpPlayer()
}

export function loadPlayer(): void {
  loadPlayerData(structuredClone(defaultSave) as PlayerSave)
}

export function addDialoguePick(locKey: LocationKey, choiceId: string): void {
  const picks = ensureDialoguePicks()
  const current = picks[locKey] ?? []
  if (current.includes(choiceId)) return
  picks[locKey] = [...current, choiceId]
  savePlayer()
}

export function savePlayer(): void {
  persistActiveCharacter()
  bumpPlayer()
}

export function resetPlayer(keepName?: string): void {
  player = structuredClone(defaultSave) as PlayerSave
  if (keepName) player.name = keepName
  if (!player.dialoguePicks) player.dialoguePicks = {}
  normalizePlayer(player)
  persistActiveCharacter()
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
}

export function applyDamage(amount: number): void {
  player.hp = Math.max(0, player.hp - amount)
  savePlayer()
}

export function setHp(hp: number): void {
  player.hp = Math.min(player.maxHp, Math.max(0, hp))
  savePlayer()
}

export function isPlayerDead(): boolean {
  return player.hp <= 0
}

export function getExploredInZone(zoneId: string): LocationKey[] {
  const prefix = `${zoneId}/`
  return player.exploredSubZones.filter((key) => key.startsWith(prefix))
}
