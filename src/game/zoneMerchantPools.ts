import { getEnemy } from '../combat/registry'
import { isCombatContent } from '../types/game'
import { getAllItems } from './itemRegistry'
import { getZone } from './zoneRegistry'

/** Butins pouvant tomber sur les monstres de la zone. */
export function getZoneLootItemIds(zoneId: string): string[] {
  const zone = getZone(zoneId)
  if (!zone) return []

  const ids = new Set<string>()
  for (const subZone of zone.subZones) {
    if (!isCombatContent(subZone.content)) continue
    const enemy = getEnemy(subZone.content.encounterId)
    if (!enemy?.loot) continue
    for (const entry of enemy.loot) {
      ids.add(entry.itemId)
    }
  }
  return [...ids]
}

/** Récoltes du catalogue rattachées à cette zone. */
export function getZoneGatherItemIds(zoneId: string): string[] {
  return getAllItems()
    .filter((item) => item.category === 'gather')
    .filter((item) => !item.zones?.length || item.zones.includes(zoneId))
    .map((item) => item.id)
}

function intersectPools(configured: string[] | undefined, zonePool: string[]): string[] {
  const base = zonePool.length ? zonePool : []
  if (!configured?.length) return base
  const allowed = new Set(base)
  return configured.filter((id) => allowed.has(id))
}

export function resolveMerchantGatherPool(
  zoneId: string,
  configured?: string[],
): string[] {
  return intersectPools(configured, getZoneGatherItemIds(zoneId))
}

export function resolveMerchantLootPool(
  zoneId: string,
  configured?: string[],
): string[] {
  return intersectPools(configured, getZoneLootItemIds(zoneId))
}
