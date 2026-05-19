<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MerchantContent } from '../../types/game'
import {
  addGallions,
  addItems,
  getGallions,
  getItemCount,
  getInventoryDetails,
  removeItem,
} from '../../game/inventory'
import {
  getOrCreateMerchantStock,
  reduceSellOffer,
  refreshMerchantStock,
} from '../../game/merchantState'
import { getPlayer, playerRevision } from '../../game/playerStore'
import { notifyPlayerUpdate } from '../../game/gameSession'
import { getItem, getItemsByIds } from '../../game/itemRegistry'
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

const inventory = computed(() => {
  playerRevision.value
  return getInventoryDetails()
})

const catalogueGather = computed(() =>
  getItemsByIds(props.content.gatherPool ?? []),
)

const catalogueLoot = computed(() =>
  getItemsByIds(props.content.lootSellPool ?? []),
)

const buyOffersVisible = computed(() =>
  stock.value.buyOffers.filter((line) => line.unitPrice > 0),
)

const sellOffersVisible = computed(() =>
  stock.value.sellOffers.filter((line) => line.quantity > 0 && line.unitPrice > 0),
)

function getSellQty(itemId: string): number {
  return sellQty.value[itemId] ?? 1
}

function setSellQty(itemId: string, value: number): void {
  sellQty.value = { ...sellQty.value, [itemId]: Math.max(1, value) }
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

function showFeedback(msg: string): void {
  feedback.value = msg
  setTimeout(() => {
    if (feedback.value === msg) feedback.value = ''
  }, 2500)
}

function handleSellToMerchant(itemId: string, unitPrice: number): void {
  const qty = getSellQty(itemId)
  const owned = getItemCount(itemId)
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
): void {
  const qty = getBuyQty(itemId, maxStock)
  const cost = qty * unitPrice
  if (getGallions() < cost) {
    showFeedback('Pas assez de Gallions.')
    return
  }
  addGallions(-cost)
  addItems([{ itemId, quantity: qty }])
  reduceSellOffer(zoneId.value, props.content.merchantId, itemId, qty)
  const name = getItem(itemId)?.name ?? itemId
  addJournal([`Achat : ${qty}× ${name} pour ${cost} Gallions.`])
  showFeedback(`Achat effectué (−${cost} Gallions)`)
  notifyPlayerUpdate()
}

function handleRefreshStock(): void {
  refreshMerchantStock(zoneId.value, props.content)
  showFeedback('Étal renouvelé.')
}
</script>

<template>
  <div class="merchant-panel">
    <p class="merchant-panel__wallet">
      <strong>{{ gallions }}</strong> Gallions
    </p>

    <p v-if="feedback" class="merchant-panel__feedback">{{ feedback }}</p>

    <section class="merchant-panel__catalogue">
      <h3>Catalogue de la zone</h3>
      <p class="merchant-panel__catalogue-intro">
        {{ merchantLabel }} pioche chaque jour
        {{ content.stockSize ?? 5 }} offres parmi ces listes.
      </p>

      <div v-if="catalogueGather.length" class="merchant-catalogue-block">
        <h4>Récoltes acceptées</h4>
        <ul class="merchant-catalogue-list">
          <li v-for="item in catalogueGather" :key="item.id" class="merchant-catalogue-item">
            <span class="merchant-catalogue-item__name">{{ item.name }}</span>
            <span class="merchant-catalogue-item__meta">
              Rachat {{ item.sellPrice }} G · Achat {{ item.buyPrice }} G
            </span>
            <p v-if="item.description" class="merchant-catalogue-item__desc">
              {{ item.description }}
            </p>
          </li>
        </ul>
      </div>

      <div v-if="catalogueLoot.length" class="merchant-catalogue-block">
        <h4>Butins en vente</h4>
        <ul class="merchant-catalogue-list">
          <li v-for="item in catalogueLoot" :key="item.id" class="merchant-catalogue-item">
            <span class="merchant-catalogue-item__name">{{ item.name }}</span>
            <span class="merchant-catalogue-item__meta">
              Vente {{ item.buyPrice }} G · Rachat {{ item.sellPrice }} G
            </span>
            <p v-if="item.description" class="merchant-catalogue-item__desc">
              {{ item.description }}
            </p>
          </li>
        </ul>
      </div>
    </section>

    <section class="merchant-panel__section">
      <div class="merchant-panel__section-head">
        <h3>{{ merchantLabel }} achète (récoltes du jour)</h3>
        <span class="merchant-panel__hint">Vendez vos objets de récolte</span>
      </div>
      <p v-if="!buyOffersVisible.length" class="merchant-panel__empty">
        Aucune offre d'achat aujourd'hui. Renouvelez l'étal ou revenez plus tard.
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
              :max="getItemCount(line.itemId)"
              class="merchant-trade-row__qty"
              :value="getSellQty(line.itemId)"
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

    <section class="merchant-panel__section">
      <div class="merchant-panel__section-head">
        <h3>{{ merchantLabel }} vend (butin du jour)</h3>
        <span class="merchant-panel__hint">Loot de monstres de la zone</span>
      </div>
      <p v-if="!sellOffersVisible.length" class="merchant-panel__empty">
        Rien en vitrine pour l'instant.
      </p>
      <ul v-else class="merchant-trade-list">
        <li
          v-for="line in sellOffersVisible"
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
              :disabled="gallions < line.unitPrice"
              @click="handleBuyFromMerchant(line.itemId, line.unitPrice, line.quantity)"
            >
              Acheter
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="inventory.length" class="merchant-panel__inventory">
      <h3>Votre sac</h3>
      <ul class="merchant-panel__inv-full">
        <li v-for="entry in inventory" :key="entry.itemId" class="merchant-panel__inv-row">
          <span class="merchant-panel__inv-qty">{{ entry.quantity }}×</span>
          <span>{{ entry.name }}</span>
          <span v-if="entry.description" class="merchant-panel__inv-desc">
            — {{ entry.description }}
          </span>
        </li>
      </ul>
    </section>

    <button type="button" class="btn-secondary merchant-panel__refresh" @click="handleRefreshStock">
      Renouveler l'étal ({{ content.stockSize ?? 5 }} offres aléatoires)
    </button>
  </div>
</template>
