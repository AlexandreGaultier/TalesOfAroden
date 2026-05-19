import { ref } from 'vue'
import type { MerchantContent } from '../types/game'
import { getItem } from './itemRegistry'

const STOCK_DEFAULT = 5

export interface MerchantStockLine {
  itemId: string
  name: string
  /** Prix unitaire pour cette transaction. */
  unitPrice: number
  /** Quantité proposée (vente marchand) ou demandée max (achat). */
  quantity: number
}

export interface MerchantStock {
  /** Le marchand achète ces objets au joueur. */
  buyOffers: MerchantStockLine[]
  /** Le marchand vend ces objets au joueur. */
  sellOffers: MerchantStockLine[]
}

const stocks = ref<Record<string, MerchantStock>>({})

function stockKey(zoneId: string, merchantId: string): string {
  return `${zoneId}/${merchantId}`
}

function pickRandomIds(pool: string[], count: number): string[] {
  const unique = [...new Set(pool)]
  const shuffled = unique.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getOrCreateMerchantStock(
  zoneId: string,
  content: MerchantContent,
): MerchantStock {
  const key = stockKey(zoneId, content.merchantId)
  const existing = stocks.value[key]
  if (existing) return existing

  const size = content.stockSize ?? STOCK_DEFAULT
  const gatherIds = pickRandomIds(content.gatherPool ?? [], size)
  const lootIds = pickRandomIds(content.lootSellPool ?? [], size)

  const buyOffers: MerchantStockLine[] = gatherIds
    .map((itemId) => {
      const item = getItem(itemId)
      if (!item) return null
      return {
        itemId,
        name: item.name,
        unitPrice: item.sellPrice,
        quantity: 99,
      }
    })
    .filter((l): l is MerchantStockLine => l !== null)

  const sellOffers: MerchantStockLine[] = lootIds
    .map((itemId) => {
      const item = getItem(itemId)
      if (!item) return null
      return {
        itemId,
        name: item.name,
        unitPrice: item.buyPrice,
        quantity: Math.max(1, Math.floor(Math.random() * 3) + 1),
      }
    })
    .filter((l): l is MerchantStockLine => l !== null)

  const stock: MerchantStock = { buyOffers, sellOffers }
  stocks.value = { ...stocks.value, [key]: stock }
  return stock
}

export function refreshMerchantStock(
  zoneId: string,
  content: MerchantContent,
): MerchantStock {
  const key = stockKey(zoneId, content.merchantId)
  const next = { ...stocks.value }
  delete next[key]
  stocks.value = next
  return getOrCreateMerchantStock(zoneId, content)
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
  const sellOffers = stock.sellOffers.map((line) => {
    if (line.itemId !== itemId) return line
    return { ...line, quantity: Math.max(0, line.quantity - quantity) }
  })
  stocks.value = {
    ...stocks.value,
    [key]: { ...stock, sellOffers },
  }
}
