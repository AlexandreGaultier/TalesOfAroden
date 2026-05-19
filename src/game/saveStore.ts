import { ref } from 'vue'
import defaultSave from '../data/player-default.json'
import type { PlayerSave } from '../types/game'
import type { CharacterListItem, CharacterSave, SaveRegistry } from '../types/save'
import { getRollStateSnapshot, loadRollState } from './actionRollState'
import { getCombatVisitsSnapshot, loadCombatVisits } from './combatState'
import { getJournalSnapshot, loadJournal } from './journal'
import { getPlayer, loadPlayerData } from './playerStore'

const REGISTRY_KEY = 'tales-of-aroden-characters'
const LEGACY_KEY = 'tales-of-aroden-save'

export const activeCharacterId = ref<string | null>(null)

function emptyRegistry(): SaveRegistry {
  return { characters: [] }
}

function readRegistry(): SaveRegistry {
  const raw = localStorage.getItem(REGISTRY_KEY)
  if (!raw) return migrateLegacySave(emptyRegistry())
  try {
    const parsed = JSON.parse(raw) as SaveRegistry
    if (!Array.isArray(parsed.characters)) return emptyRegistry()
    return parsed
  } catch {
    return emptyRegistry()
  }
}

function writeRegistry(registry: SaveRegistry): void {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
}

function migrateLegacySave(registry: SaveRegistry): SaveRegistry {
  if (registry.characters.length > 0) return registry
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return registry
  try {
    const player = JSON.parse(raw) as PlayerSave
    if (!player.dialoguePicks) player.dialoguePicks = {}
    if (typeof player.gallions !== 'number') player.gallions = 0
    if (!player.inventory) player.inventory = {}
    const slot: CharacterSave = {
      id: `char-${Date.now()}`,
      player,
      journal: [],
      combatVisits: {},
      rollState: {},
      updatedAt: Date.now(),
    }
    writeRegistry({ characters: [slot] })
    localStorage.removeItem(LEGACY_KEY)
    return { characters: [slot] }
  } catch {
    return registry
  }
}

function buildSlotFromRuntime(id: string): CharacterSave {
  return {
    id,
    player: structuredClone(getPlayer()) as PlayerSave,
    journal: getJournalSnapshot(),
    combatVisits: getCombatVisitsSnapshot(),
    rollState: getRollStateSnapshot(),
    updatedAt: Date.now(),
  }
}

export function listCharacters(): CharacterListItem[] {
  return readRegistry()
    .characters.map((c) => ({
      id: c.id,
      name: c.player.name,
      hp: c.player.hp,
      maxHp: c.player.maxHp,
      zoneId: c.player.currentZoneId,
      updatedAt: c.updatedAt,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getCharacter(id: string): CharacterSave | undefined {
  return readRegistry().characters.find((c) => c.id === id)
}

export function createCharacter(name: string): CharacterSave {
  const trimmed = name.trim() || 'Voyageur'
  const slot: CharacterSave = {
    id: `char-${Date.now()}`,
    player: {
      ...(structuredClone(defaultSave) as PlayerSave),
      name: trimmed,
    },
    journal: [],
    combatVisits: {},
    rollState: {},
    updatedAt: Date.now(),
  }
  const registry = readRegistry()
  registry.characters.push(slot)
  writeRegistry(registry)
  return slot
}

export function deleteCharacter(id: string): void {
  const registry = readRegistry()
  registry.characters = registry.characters.filter((c) => c.id !== id)
  writeRegistry(registry)
  if (activeCharacterId.value === id) {
    activeCharacterId.value = null
  }
}

export function applyCharacterSlot(slot: CharacterSave): void {
  activeCharacterId.value = slot.id
  loadPlayerData(slot.player)
  loadJournal(slot.journal)
  loadCombatVisits(slot.combatVisits)
  loadRollState(slot.rollState)
}

export function persistActiveCharacter(): boolean {
  const id = activeCharacterId.value
  if (!id) return false

  const registry = readRegistry()
  const slot = buildSlotFromRuntime(id)
  const index = registry.characters.findIndex((c) => c.id === id)
  if (index >= 0) {
    registry.characters[index] = slot
  } else {
    registry.characters.push(slot)
  }
  writeRegistry(registry)
  return true
}

export function clearActiveCharacter(): void {
  activeCharacterId.value = null
}
