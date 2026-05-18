import type { PlayerSave } from './game'
import type { SubZoneRollState } from '../game/actionRollState'

export interface CharacterSave {
  id: string
  player: PlayerSave
  journal: string[]
  combatVisits: Record<string, boolean>
  rollState: Record<string, SubZoneRollState>
  updatedAt: number
}

export interface CharacterListItem {
  id: string
  name: string
  hp: number
  maxHp: number
  zoneId: string
  updatedAt: number
}

export interface SaveRegistry {
  characters: CharacterSave[]
}
