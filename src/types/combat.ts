/** Symboles de dé : 1–3 épée, 4–5 bouclier, 6 aura. */
export type DieSymbol = 'sword' | 'shield' | 'aura'

/** Combinaison requise : symbole → quantité. */
export type DicePattern = Partial<Record<DieSymbol, number>>

export interface CombatAbility {
  id: string
  name: string
  description: string
  pattern: DicePattern
  damage: number
  /** Priorité en cas de plusieurs correspondances (plus haut = préféré par l'IA). */
  priority?: number
}

export interface CombatantDef {
  id: string
  name: string
  maxHp: number
  abilities: CombatAbility[]
}

export interface FighterState {
  defId: string
  name: string
  hp: number
  maxHp: number
}

export type CombatPhase =
  | 'initiative'
  | 'player_roll'
  | 'player_ability'
  | 'enemy_turn'
  | 'ended'

export interface CombatContext {
  subZoneId: string
  zoneId: string
  victoryFlag: string
  isRematch: boolean
  introTitle: string
}

export type CombatLogKind =
  | 'system'
  | 'turn-hero'
  | 'turn-enemy'
  | 'action-hero'
  | 'action-enemy'
  | 'damage'
  | 'dice'
  | 'result'

export interface CombatLogEntry {
  kind: CombatLogKind
  message: string
}

export interface CombatSession {
  context: CombatContext
  phase: CombatPhase
  hero: FighterState
  enemy: FighterState
  dice: number[]
  /** true = ce dé sera relancé au prochain « Relancer ». */
  toReroll: boolean[]
  rerollsLeft: number
  initiative: { hero: number; enemy: number } | null
  activeSide: 'hero' | 'enemy'
  log: CombatLogEntry[]
  winner: 'hero' | 'enemy' | null
  initiativeShownAt: number | null
  /** Capacité utilisée par l'ennemi au dernier tour (affichage). */
  lastEnemyAbilityId: string | null
}
