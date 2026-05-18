import { ref } from 'vue'

export type RollKind = 'vigilance' | 'combat'

export interface StoredRoll {
  kind: RollKind
  value: number
  lines: string[]
  won?: boolean
}

export interface SubZoneRollState {
  vigilance?: StoredRoll
  combat?: StoredRoll
  rematchTriggered?: boolean
}

const rollState = ref<Record<string, SubZoneRollState>>({})

export function getRollState(subZoneId: string): SubZoneRollState {
  return rollState.value[subZoneId] ?? {}
}

export function setVigilanceRoll(subZoneId: string, roll: StoredRoll): void {
  rollState.value = {
    ...rollState.value,
    [subZoneId]: {
      ...getRollState(subZoneId),
      vigilance: roll,
    },
  }
}

export function setCombatRoll(subZoneId: string, roll: StoredRoll): void {
  rollState.value = {
    ...rollState.value,
    [subZoneId]: {
      ...getRollState(subZoneId),
      combat: roll,
    },
  }
}

export function setRematchTriggered(subZoneId: string, triggered: boolean): void {
  rollState.value = {
    ...rollState.value,
    [subZoneId]: {
      ...getRollState(subZoneId),
      rematchTriggered: triggered,
    },
  }
}

export function clearRollState(subZoneId: string): void {
  const next = { ...rollState.value }
  delete next[subZoneId]
  rollState.value = next
}

export function resetAllRollStates(): void {
  rollState.value = {}
}

export function getRollStateSnapshot(): Record<string, SubZoneRollState> {
  return { ...rollState.value }
}

export function loadRollState(data: Record<string, SubZoneRollState>): void {
  rollState.value = { ...data }
}

export function hasVigilanceRoll(subZoneId: string): boolean {
  return getRollState(subZoneId).vigilance !== undefined
}

export function hasCombatRoll(subZoneId: string): boolean {
  return getRollState(subZoneId).combat !== undefined
}
