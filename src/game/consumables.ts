import { getItem, itemHasFlag } from './itemRegistry'
import { getItemCount, removeItem } from './inventory'
import { getPlayer, healPlayer } from './playerStore'

export interface UseConsumableResult {
  ok: boolean
  message: string
}

/** Effets déclenchés par les flags d'objet (ex. heal_5). */
function applyUseFlags(flags: string[]): UseConsumableResult {
  if (flags.includes('heal_5')) {
    const p = getPlayer()
    if (p.hp >= p.maxHp) {
      return { ok: false, message: 'Vos points de vie sont déjà au maximum.' }
    }
    const gained = healPlayer(5)
    return { ok: true, message: `Vous récupérez ${gained} PV.` }
  }

  return { ok: false, message: 'Cet objet n’a pas d’effet utilisable.' }
}

export function useConsumable(itemId: string): UseConsumableResult {
  const def = getItem(itemId)
  if (!def) return { ok: false, message: 'Objet inconnu.' }
  if (!itemHasFlag(def, 'consumable')) {
    return { ok: false, message: 'Cet objet ne peut pas être consommé.' }
  }
  if (getItemCount(itemId) < 1) {
    return { ok: false, message: 'Vous n’en avez plus.' }
  }

  const effect = applyUseFlags(def.flags ?? [])
  if (!effect.ok) return effect

  if (!removeItem(itemId, 1)) {
    return { ok: false, message: 'Impossible de consommer cet objet.' }
  }

  return effect
}
