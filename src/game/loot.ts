import type { LootGrant, LootTableEntry, QuantityChances } from '../types/loot'
import { getItem } from './itemRegistry'
import { addItems } from './inventory'

const QTY_ORDER = [5, 4, 3, 2, 1] as const

export function rollQuantity(quantityChances: QuantityChances): number {
  for (const n of QTY_ORDER) {
    const chance = quantityChances[String(n)] ?? 0
    if (chance > 0 && Math.random() < chance) return n
  }
  return 1
}

export function rollLootTable(table: LootTableEntry[]): LootGrant[] {
  const grants: LootGrant[] = []

  for (const entry of table) {
    if (Math.random() >= entry.dropChance) continue
    const item = getItem(entry.itemId)
    if (!item) continue

    const quantity = rollQuantity(entry.quantityChances)
    if (quantity <= 0) continue

    grants.push({
      itemId: entry.itemId,
      quantity,
      name: item.name,
    })
  }

  return grants
}

export function applyLootGrants(grants: LootGrant[]): LootGrant[] {
  if (!grants.length) return []
  const merged = new Map<string, LootGrant>()

  for (const g of grants) {
    const prev = merged.get(g.itemId)
    if (prev) {
      prev.quantity += g.quantity
    } else {
      merged.set(g.itemId, { ...g })
    }
  }

  const list = [...merged.values()]
  addItems(list.map((g) => ({ itemId: g.itemId, quantity: g.quantity })))
  return list
}

export function formatLootMessage(grants: LootGrant[]): string {
  if (!grants.length) return 'Aucun butin récupéré.'
  return grants.map((g) => `${g.quantity}× ${g.name}`).join(', ')
}
