import type { SubZoneType } from '../types/game'

/** Couleurs par type — utilisées en CSS via data-zone-type. */
export const ZONE_TYPE_LABELS: Record<SubZoneType, string> = {
  narrative: 'Récit',
  combat: 'Combat',
  dialogue: 'Dialogue',
  dungeon: 'Donjon',
  exit: 'Sortie',
  merchant: 'Marchand',
}

export const ZONE_TYPE_COLORS: Record<
  SubZoneType,
  { bg: string; border: string; text: string }
> = {
  narrative: { bg: '#f5edd6', border: '#c9a227', text: '#5c4a12' },
  combat: { bg: '#f5d6d6', border: '#b33a3a', text: '#5c1212' },
  dialogue: { bg: '#d6e8f5', border: '#2a6a9e', text: '#123a5c' },
  dungeon: { bg: '#e5d6f5', border: '#6a3a9e', text: '#3a125c' },
  exit: { bg: '#d6f5e0', border: '#2a9e4a', text: '#125c2a' },
  merchant: { bg: '#f5e8d6', border: '#c97a27', text: '#5c3a12' },
}
