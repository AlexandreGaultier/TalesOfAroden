import type { DialogueChoice, DialogueContent } from '../types/game'
import { locationKey } from '../types/game'
import { addDialoguePick, getPlayer } from './playerStore'
import { getSubZone } from './zoneRegistry'

export function getDialoguePicks(zoneId: string, subZoneId: string): string[] {
  const k = locationKey(zoneId, subZoneId)
  return getPlayer().dialoguePicks[k] ?? []
}

export function pickDialogueChoice(
  zoneId: string,
  subZoneId: string,
  choiceId: string,
): void {
  addDialoguePick(locationKey(zoneId, subZoneId), choiceId)
}

export function getDialogueContent(
  zoneId: string,
  subZoneId: string,
): DialogueContent | undefined {
  const sz = getSubZone(zoneId, subZoneId)
  if (!sz || sz.type !== 'dialogue') return undefined
  if (!('choices' in sz.content)) return undefined
  return sz.content
}

export function getAvailableChoices(
  content: DialogueContent,
  pickedIds: string[],
): DialogueChoice[] {
  const picked = new Set(pickedIds)
  const availableIds = new Set(content.initialChoiceIds)

  for (const id of picked) {
    const choice = content.choices.find((c) => c.id === id)
    choice?.reveals?.forEach((r) => availableIds.add(r))
  }

  return content.choices.filter(
    (c) => availableIds.has(c.id) && !picked.has(c.id),
  )
}

export function isDialogueComplete(zoneId: string, subZoneId: string): boolean {
  const content = getDialogueContent(zoneId, subZoneId)
  if (!content) return true
  const picked = getDialoguePicks(zoneId, subZoneId)
  return content.choices.every((c) => picked.includes(c.id))
}

export function getPickedChoices(
  content: DialogueContent,
  pickedIds: string[],
): DialogueChoice[] {
  return content.choices.filter((c) => pickedIds.includes(c.id))
}
