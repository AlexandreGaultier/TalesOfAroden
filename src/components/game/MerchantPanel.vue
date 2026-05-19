<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MerchantContent } from '../../types/game'
import {
  addGallions,
  addItems,
  getGallions,
  getItemCount,
  removeItem,
} from '../../game/inventory'
import { getOrCreateMerchantStock, reduceSellOffer } from '../../game/merchantState'
import { getItem, isConsumableItem } from '../../game/itemRegistry'
import { getPlayer, playerRevision } from '../../game/playerStore'
import { notifyPlayerUpdate } from '../../game/gameSession'
import { addJournal } from '../../game/journal'

const props = defineProps<{
  content: MerchantContent
}>()

const sellQty = ref<Record<string, number>>({})
const buyQty = ref<Record<string, number>>({})
const feedback = ref('')

const merchantLabel = computed(() => props.content.shopName)
const zoneId = computed(() => getPlayer().currentZoneId)

const stock = computed(() => {
  playerRevision.value
  return getOrCreateMerchantStock(zoneId.value, props.content)
})

const gallions = computed(() => {
  playerRevision.value
  return getGallions()
})

/** Ce que le marchand rachète (récoltes + butin de la zone). */
const buyOffersVisible = computed(() =>
  stock.value.buyOffers.filter((line) => line.unitPrice > 0),
)

const consumableSellOffers = computed(() =>
  stock.value.sellOffers.filter(
    (line) => line.unitPrice > 0 && (line.unlimited || isConsumableItem(line.itemId)),
  ),
)

const lootSellOffers = computed(() =>
  stock.value.sellOffers.filter(
    (line) =>
      line.quantity > 0 &&
      line.unitPrice > 0 &&
      !line.unlimited &&
      !isConsumableItem(line.itemId),
  ),
)

function getSellQty(itemId: string): number {
  const owned = getItemCount(itemId)
  if (owned < 1) return 1
  const q = sellQty.value[itemId] ?? 1
  return Math.min(Math.max(1, q), owned)
}

function setSellQty(itemId: string, value: number): void {
  const owned = getItemCount(itemId)
  sellQty.value = {
    ...sellQty.value,
    [itemId]: Math.min(Math.max(1, value), Math.max(1, owned)),
  }
}

function getBuyQty(itemId: string, max: number): number {
  const q = buyQty.value[itemId] ?? 1
  return Math.min(Math.max(1, q), max)
}

function setBuyQty(itemId: string, value: number, max: number): void {
  buyQty.value = {
    ...buyQty.value,
    [itemId]: Math.min(Math.max(1, value), max),
  }
}

function buyCost(itemId: string, unitPrice: number, maxStock: number): number {
  return getBuyQty(itemId, maxStock) * unitPrice
}

function canAffordBuy(itemId: string, unitPrice: number, maxStock: number): boolean {
  return gallions.value >= buyCost(itemId, unitPrice, maxStock)
}

function showFeedback(msg: string): void {
  feedback.value = msg
  setTimeout(() => {
    if (feedback.value === msg) feedback.value = ''
  }, 2500)
}

function handleSellToMerchant(itemId: string, unitPrice: number): void {
  const owned = getItemCount(itemId)
  if (owned < 1) {
    showFeedback("Vous n'avez pas cet objet dans votre sac.")
    return
  }
  const qty = getSellQty(itemId)
  if (qty > owned) {
    showFeedback('Quantité insuffisante dans votre sac.')
    return
  }
  if (!removeItem(itemId, qty)) return
  const total = qty * unitPrice
  addGallions(total)
  const name = getItem(itemId)?.name ?? itemId
  addJournal([`Vente : ${qty}× ${name} pour ${total} Gallions.`])
  showFeedback(`+${total} Gallions`)
  notifyPlayerUpdate()
}

function handleBuyFromMerchant(
  itemId: string,
  unitPrice: number,
  maxStock: number,
  unlimited = false,
): void {
  const qty = getBuyQty(itemId, maxStock)
  const cost = qty * unitPrice
  if (getGallions() < cost) {
    showFeedback('Pas assez de Gallions.')
    return
  }
  addGallions(-cost)
  addItems([{ itemId, quantity: qty }])
  if (!unlimited) {
    reduceSellOffer(zoneId.value, props.content.merchantId, itemId, qty)
  }
  const name = getItem(itemId)?.name ?? itemId
  addJournal([`Achat : ${qty}× ${name} pour ${cost} Gallions.`])
  showFeedback(`Achat effectué (−${cost} Gallions)`)
  notifyPlayerUpdate()
}
</script>

<template>
  <div class="merchant-panel">
    <p class="merchant-panel__wallet">
      <strong>{{ gallions }}</strong> Gallions
    </p>

    <p v-if="feedback" class="merchant-panel__feedback">{{ feedback }}</p>

    <section class="merchant-panel__section">
      <div class="merchant-panel__section-head">
        <h3>{{ merchantLabel }} rachète</h3>
        <span class="merchant-panel__hint">Butin et récoltes de la zone — dans votre sac</span>
      </div>
      <p v-if="!buyOffersVisible.length" class="merchant-panel__empty">
        Aucune offre de rachat pour le moment.
      </p>
      <ul v-else class="merchant-trade-list">
        <li
          v-for="line in buyOffersVisible"
          :key="`buy-${line.itemId}`"
          class="merchant-trade-row"
        >
          <div class="merchant-trade-row__info">
            <span class="merchant-trade-row__name">{{ line.name }}</span>
            <span class="merchant-trade-row__price">
              {{ line.unitPrice }} G / unité · vous en avez
              {{ getItemCount(line.itemId) }}
            </span>
          </div>
          <div class="merchant-trade-row__actions">
            <input
              type="number"
              min="1"
              :max="Math.max(1, getItemCount(line.itemId))"
              class="merchant-trade-row__qty"
              :value="getSellQty(line.itemId)"
              :disabled="getItemCount(line.itemId) < 1"
              @input="setSellQty(line.itemId, Number(($event.target as HTMLInputElement).value))"
            />
            <button
              type="button"
              class="btn-secondary"
              :disabled="getItemCount(line.itemId) < 1"
              @click="handleSellToMerchant(line.itemId, line.unitPrice)"
            >
              Vendre
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="consumableSellOffers.length" class="merchant-panel__section">
      <div class="merchant-panel__section-head">
        <h3>Consommables</h3>
        <span class="merchant-panel__hint">Toujours disponibles</span>
      </div>
      <ul class="merchant-trade-list">
        <li
          v-for="line in consumableSellOffers"
          :key="`con-${line.itemId}`"
          class="merchant-trade-row merchant-trade-row--consumable"
        >
          <div class="merchant-trade-row__info">
            <span class="merchant-trade-row__name">{{ line.name }}</span>
            <span class="merchant-trade-row__price">{{ line.unitPrice }} G / unité</span>
          </div>
          <div class="merchant-trade-row__actions">
            <input
              type="number"
              min="1"
              max="10"
              class="merchant-trade-row__qty"
              :value="getBuyQty(line.itemId, 10)"
              @input="setBuyQty(line.itemId, Number(($event.target as HTMLInputElement).value), 10)"
            />
            <button
              type="button"
              class="btn-primary"
              :disabled="!canAffordBuy(line.itemId, line.unitPrice, 10)"
              @click="handleBuyFromMerchant(line.itemId, line.unitPrice, 10, true)"
            >
              Acheter
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section class="merchant-panel__section">
      <div class="merchant-panel__section-head">
        <h3>{{ merchantLabel }} vend (butin)</h3>
        <span class="merchant-panel__hint">Loot des monstres de la zone</span>
      </div>
      <p v-if="!lootSellOffers.length" class="merchant-panel__empty">
        Rien d'autre en vitrine pour l'instant.
      </p>
      <ul v-else class="merchant-trade-list">
        <li
          v-for="line in lootSellOffers"
          :key="`sell-${line.itemId}`"
          class="merchant-trade-row"
        >
          <div class="merchant-trade-row__info">
            <span class="merchant-trade-row__name">{{ line.name }}</span>
            <span class="merchant-trade-row__price">
              {{ line.unitPrice }} G / unité · stock {{ line.quantity }}
            </span>
          </div>
          <div class="merchant-trade-row__actions">
            <input
              type="number"
              min="1"
              :max="line.quantity"
              class="merchant-trade-row__qty"
              :value="getBuyQty(line.itemId, line.quantity)"
              @input="setBuyQty(line.itemId, Number(($event.target as HTMLInputElement).value), line.quantity)"
            />
            <button
              type="button"
              class="btn-primary"
              :disabled="!canAffordBuy(line.itemId, line.unitPrice, line.quantity)"
              @click="handleBuyFromMerchant(line.itemId, line.unitPrice, line.quantity)"
            >
              Acheter
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
