/** Types de sous-zones — chaque type a sa couleur et son comportement futur. */
export type SubZoneType =
  | 'narrative'
  | 'combat'
  | 'dialogue'
  | 'dungeon'
  | 'exit'
  | 'merchant'

/** Lien vers une autre sous-zone (cible peut être inexplorée). */
export interface ZoneConnection {
  targetId: string
  travelLabel: string
}

export interface MapPosition {
  col: number
  row: number
}

export interface NarrativeContent {
  speaker: string
  lines: string[]
}

export interface DialogueChoice {
  id: string
  label: string
  npcReply: string[]
  /** Ids des choix débloqués après celui-ci. */
  reveals?: string[]
}

export interface DialogueContent {
  npcId: string
  npcName: string
  intro: string[]
  initialChoiceIds: string[]
  choices: DialogueChoice[]
}

export interface CombatContent {
  encounterId: string
  /** Référence JSON dans data/combat/enemies/ */
  enemyId: string
  title: string
  rematchTitle: string
  victoryFlag: string
  rematchThreshold?: number
  /** Si le d20 de vigilance est favorable. */
  vigilanceSafeText: string
  /** Si le d20 déclenche une ré-escalade (avant le combat). */
  vigilanceDangerText: string
  combatWinText?: string
  combatLoseText?: string
}

export interface DungeonContent {
  dungeonId: string
  name: string
  dataFile?: string
  teaser: string
}

export interface ExitContent {
  targetZoneId: string
  targetZoneName: string
  requiredFlag?: string
}

export interface MerchantContent {
  merchantId: string
  shopName: string
  greeting: string
}

export type SubZoneContent =
  | NarrativeContent
  | DialogueContent
  | CombatContent
  | DungeonContent
  | ExitContent
  | MerchantContent

export interface SubZone {
  id: string
  type: SubZoneType
  name: string
  narrative: string
  mapPosition: MapPosition
  connections: ZoneConnection[]
  content: SubZoneContent
}

export interface GameZone {
  id: string
  name: string
  description: string
  startingSubZoneId: string
  subZones: SubZone[]
}

export type LocationKey = `${string}/${string}`

export interface PlayerSave {
  name: string
  hp: number
  maxHp: number
  flags: string[]
  currentZoneId: string
  currentSubZoneId: string
  exploredSubZones: LocationKey[]
  /** Choix de dialogue déjà prononcés par lieu. */
  dialoguePicks: Partial<Record<LocationKey, string[]>>
}

export function locationKey(zoneId: string, subZoneId: string): LocationKey {
  return `${zoneId}/${subZoneId}`
}

export function isNarrativeContent(
  content: SubZoneContent,
): content is NarrativeContent {
  return 'lines' in content && 'speaker' in content && !('npcId' in content)
}

export function isDialogueContent(
  content: SubZoneContent,
): content is DialogueContent {
  return 'npcId' in content && 'choices' in content
}

export function isCombatContent(
  content: SubZoneContent,
): content is CombatContent {
  return 'encounterId' in content
}

export function isDungeonContent(
  content: SubZoneContent,
): content is DungeonContent {
  return 'dungeonId' in content
}

export function isExitContent(content: SubZoneContent): content is ExitContent {
  return 'targetZoneId' in content
}

export function isMerchantContent(
  content: SubZoneContent,
): content is MerchantContent {
  return 'merchantId' in content
}
