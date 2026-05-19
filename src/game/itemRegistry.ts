import catalogJson from '../data/items/catalog.json'
import type { ItemDef } from '../types/loot'

const catalog = catalogJson as Record<string, ItemDef>

export function getItem(id: string): ItemDef | undefined {
  return catalog[id]
}

export function getAllItems(): ItemDef[] {
  return Object.values(catalog)
}

export function getItemsByIds(ids: string[]): ItemDef[] {
  return ids.map((id) => getItem(id)).filter((i): i is ItemDef => i !== undefined)
}
