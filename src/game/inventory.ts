import {
  addGallions,
  addInventoryItems,
  getInventorySnapshot,
  getItemCount as getItemCountStore,
  removeInventoryItem,
} from './playerStore'

export { addGallions }
import { getItem } from './itemRegistry'

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
  category: 'loot' | 'gather' | 'unknown'
  sellPrice: number
  buyPrice: number
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
    .map(([itemId, quantity]) => {
      const def = getItem(itemId)
      return {
        itemId,
        quantity,
        name: def?.name ?? itemId,
        description: def?.description ?? '',
        category: (def?.category ?? 'unknown') as InventoryEntryView['category'],
        sellPrice: def?.sellPrice ?? 0,
        buyPrice: def?.buyPrice ?? 0,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getInventoryTotalItems(): number {
  return getInventoryDetails().reduce((sum, e) => sum + e.quantity, 0)
}
