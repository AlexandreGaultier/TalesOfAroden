import {
  addGallions,
  addInventoryItems,
  getInventorySnapshot,
  getItemCount as getItemCountStore,
  removeInventoryItem,
} from './playerStore'

export { addGallions }
import { getItem, isConsumableItem } from './itemRegistry'

export function getGallions(): number {
  return getInventorySnapshot().gallions
}

export function getInventory(): Record<string, number> {
  return { ...getInventorySnapshot().inventory }
}

export function getItemCount(itemId: string): number {
  return getItemCountStore(itemId)
}

export function addItems(
  entries: { itemId: string; quantity: number }[],
): void {
  addInventoryItems(entries)
}

export function removeItem(itemId: string, quantity: number): boolean {
  return removeInventoryItem(itemId, quantity)
}

export interface InventoryEntryView {
  itemId: string
  quantity: number
  name: string
  description: string
  category: 'loot' | 'gather' | 'consumable' | 'unknown'
  sellPrice: number
  buyPrice: number
  flags: string[]
  isConsumable: boolean
}

function mapEntry(itemId: string, quantity: number): InventoryEntryView {
  const def = getItem(itemId)
  return {
    itemId,
    quantity,
    name: def?.name ?? itemId,
    description: def?.description ?? '',
    category: (def?.category ?? 'unknown') as InventoryEntryView['category'],
    sellPrice: def?.sellPrice ?? 0,
    buyPrice: def?.buyPrice ?? 0,
    flags: def?.flags ?? [],
    isConsumable: isConsumableItem(itemId),
  }
}

export function getInventoryEntries(): Pick<
  InventoryEntryView,
  'itemId' | 'quantity' | 'name'
>[] {
  return getInventoryDetails().map(({ itemId, quantity, name }) => ({
    itemId,
    quantity,
    name,
  }))
}

export function getInventoryDetails(): InventoryEntryView[] {
  return Object.entries(getInventory())
    .filter(([, qty]) => qty > 0)
    .map(([itemId, quantity]) => mapEntry(itemId, quantity))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getInventoryItems(): InventoryEntryView[] {
  return getInventoryDetails().filter((e) => !e.isConsumable)
}

export function getInventoryConsumables(): InventoryEntryView[] {
  return getInventoryDetails().filter((e) => e.isConsumable)
}

export function getInventoryTotalItems(): number {
  return getInventoryDetails().reduce((sum, e) => sum + e.quantity, 0)
}
