import { ref } from 'vue'
import type { MerchantContent } from '../types/game'
import { getItem, isConsumableItem } from './itemRegistry'
import {
  resolveMerchantGatherPool,
  resolveMerchantLootPool,
} from './zoneMerchantPools'

const STOCK_DEFAULT = 5

export interface MerchantStockLine {
  itemId: string
  name: string
  unitPrice: number
  quantity: number
  /** Stock illimité (consommables du marchand). */
  unlimited?: boolean
}

export interface MerchantStock {
  buyOffers: MerchantStockLine[]
  sellOffers: MerchantStockLine[]
}

const stocks = ref<Record<string, MerchantStock>>({})

function stockKey(zoneId: string, merchantId: string): string {
  return `${zoneId}/${merchantId}`
}

function pickRandomIds(pool: string[], count: number): string[] {
  if (!pool.length) return []
  const unique = [...new Set(pool)]
  const shuffled = unique.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, unique.length))
}

function buildConsumableSellOffers(ids: string[]): MerchantStockLine[] {
  const lines: MerchantStockLine[] = []
  for (const itemId of ids) {
    const item = getItem(itemId)
    if (!item || !isConsumableItem(itemId) || item.buyPrice <= 0) continue
    lines.push({
      itemId,
      name: item.name,
      unitPrice: item.buyPrice,
      quantity: 99,
      unlimited: true,
    })
  }
  return lines
}

export function getOrCreateMerchantStock(
  zoneId: string,
  content: MerchantContent,
): MerchantStock {
  const key = stockKey(zoneId, content.merchantId)
  const existing = stocks.value[key]
  if (existing) return existing

  const size = content.stockSize ?? STOCK_DEFAULT
  const gatherPool = resolveMerchantGatherPool(zoneId, content.gatherPool)
  const lootPool = resolveMerchantLootPool(zoneId, content.lootSellPool)

  const buyPool = [
    ...gatherPool.filter((id) => (getItem(id)?.sellPrice ?? 0) > 0),
    ...lootPool.filter((id) => (getItem(id)?.sellPrice ?? 0) > 0),
  ]
  const buyIds = pickRandomIds(buyPool, size)
  const lootIds = pickRandomIds(
    lootPool.filter((id) => (getItem(id)?.buyPrice ?? 0) > 0),
    size,
  )

  const buyOffers: MerchantStockLine[] = buyIds
    .map((itemId) => {
      const item = getItem(itemId)
      if (!item || item.sellPrice <= 0) return null
      return {
        itemId,
        name: item.name,
        unitPrice: item.sellPrice,
        quantity: 99,
      }
    })
    .filter((l): l is MerchantStockLine => l !== null)

  const lootSellOffers: MerchantStockLine[] = lootIds
    .map((itemId) => {
      const item = getItem(itemId)
      if (!item || item.buyPrice <= 0) return null
      return {
        itemId,
        name: item.name,
        unitPrice: item.buyPrice,
        quantity: Math.max(1, Math.floor(Math.random() * 3) + 1),
      }
    })
    .filter((l): l is MerchantStockLine => l !== null)

  const consumableOffers = buildConsumableSellOffers(
    content.consumableOffers ?? ['potion-soin'],
  )

  const sellOffers = [...consumableOffers, ...lootSellOffers]

  const stock: MerchantStock = { buyOffers, sellOffers }
  stocks.value = { ...stocks.value, [key]: stock }
  return stock
}

export function clearMerchantStocksForZone(zoneId: string): void {
  const prefix = `${zoneId}/`
  const next = { ...stocks.value }
  let changed = false
  for (const key of Object.keys(next)) {
    if (key.startsWith(prefix)) {
      delete next[key]
      changed = true
    }
  }
  if (changed) stocks.value = next
}

export function clearAllMerchantStocks(): void {
  stocks.value = {}
}

export function reduceSellOffer(
  zoneId: string,
  merchantId: string,
  itemId: string,
  quantity: number,
): void {
  const key = stockKey(zoneId, merchantId)
  const stock = stocks.value[key]
  if (!stock) return
  const line = stock.sellOffers.find((l) => l.itemId === itemId)
  if (line?.unlimited) return

  const sellOffers = stock.sellOffers.map((row) => {
    if (row.itemId !== itemId) return row
    return { ...row, quantity: Math.max(0, row.quantity - quantity) }
  })
  stocks.value = {
    ...stocks.value,
    [key]: { ...stock, sellOffers },
  }
}
