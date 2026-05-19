/** Probabilités de quantité (clés "1"…"5") si l'objet est obtenu. */
export type QuantityChances = Record<string, number>

export interface LootTableEntry {
  itemId: string
  /** Probabilité d'obtenir l'objet (0–1). */
  dropChance: number
  quantityChances: QuantityChances
}

export interface ItemDef {
  id: string
  name: string
  description: string
  /** Ce que le marchand paie au joueur (vente). */
  sellPrice: number
  /** Ce que le joueur paie au marchand (achat). */
  buyPrice: number
  category: 'loot' | 'gather' | 'consumable'
  zones?: string[]
  /** Ex. consumable, heal_5 — pilote les effets à l’utilisation. */
  flags?: string[]
}

export interface LootGrant {
  itemId: string
  quantity: number
  name: string
}
