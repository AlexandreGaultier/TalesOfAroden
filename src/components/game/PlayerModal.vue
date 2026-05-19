<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConsumable } from '../../game/consumables'
import { closeModal, notifyPlayerUpdate, playerVersion } from '../../game/gameSession'
import {
  getInventoryConsumables,
  getInventoryItems,
  getInventoryTotalItems,
} from '../../game/inventory'
import { addJournal } from '../../game/journal'
import { getPlayer, playerRevision } from '../../game/playerStore'
import AppModal from './AppModal.vue'

const player = computed(() => {
  playerVersion.value
  playerRevision.value
  return getPlayer()
})

const items = computed(() => {
  playerVersion.value
  playerRevision.value
  return getInventoryItems()
})

const consumables = computed(() => {
  playerVersion.value
  playerRevision.value
  return getInventoryConsumables()
})

const totalItems = computed(() => {
  playerVersion.value
  playerRevision.value
  return getInventoryTotalItems()
})

const useFeedback = ref('')

const categoryLabel: Record<string, string> = {
  loot: 'Butin',
  gather: 'Récolte',
  consumable: 'Consommable',
  unknown: 'Autre',
}

function handleUse(itemId: string): void {
  const result = useConsumable(itemId)
  useFeedback.value = result.message
  if (result.ok) {
    addJournal([result.message])
    notifyPlayerUpdate()
  }
  setTimeout(() => {
    if (useFeedback.value === result.message) useFeedback.value = ''
  }, 2500)
}
</script>

<template>
  <AppModal title="Personnage" wide @close="closeModal">
    <dl class="player-sheet">
      <div class="player-sheet__row">
        <dt>Nom</dt>
        <dd>{{ player.name }}</dd>
      </div>
      <div class="player-sheet__row">
        <dt>Points de vie</dt>
        <dd>{{ player.hp }} / {{ player.maxHp }}</dd>
      </div>
      <div class="player-sheet__row">
        <dt>Gallions</dt>
        <dd>{{ player.gallions }} G</dd>
      </div>
    </dl>

    <p v-if="useFeedback" class="player-sheet__use-feedback">{{ useFeedback }}</p>

    <section class="player-sheet__inventory">
      <div class="player-sheet__inventory-head">
        <h3>Objets</h3>
        <span v-if="items.length" class="player-sheet__inventory-meta">
          {{ items.length }} type(s)
        </span>
      </div>

      <p v-if="!items.length" class="player-sheet__empty">
        Aucun butin ni récolte pour l'instant.
      </p>

      <ul v-else class="player-sheet__inv-full">
        <li
          v-for="entry in items"
          :key="entry.itemId"
          class="player-inv-card"
          :class="`player-inv-card--${entry.category}`"
        >
          <div class="player-inv-card__head">
            <span class="player-inv-card__qty">{{ entry.quantity }}×</span>
            <span class="player-inv-card__name">{{ entry.name }}</span>
            <span class="player-inv-card__tag">
              {{ categoryLabel[entry.category] ?? entry.category }}
            </span>
          </div>
          <p v-if="entry.description" class="player-inv-card__desc">
            {{ entry.description }}
          </p>
          <p class="player-inv-card__prices">
            Vente marchand : {{ entry.sellPrice }} G / unité
            <span v-if="entry.buyPrice > 0"> · Achat : {{ entry.buyPrice }} G</span>
          </p>
        </li>
      </ul>
    </section>

    <section class="player-sheet__inventory player-sheet__consumables">
      <div class="player-sheet__inventory-head">
        <h3>Consommables</h3>
        <span v-if="consumables.length" class="player-sheet__inventory-meta">
          {{ consumables.reduce((s, e) => s + e.quantity, 0) }} unité(s)
        </span>
      </div>

      <p v-if="!consumables.length" class="player-sheet__empty">
        Aucun consommable. Les marchands en vendent parfois.
      </p>

      <ul v-else class="player-sheet__inv-full">
        <li
          v-for="entry in consumables"
          :key="entry.itemId"
          class="player-inv-card player-inv-card--consumable"
        >
          <div class="player-inv-card__head">
            <span class="player-inv-card__qty">{{ entry.quantity }}×</span>
            <span class="player-inv-card__name">{{ entry.name }}</span>
          </div>
          <p v-if="entry.description" class="player-inv-card__desc">
            {{ entry.description }}
          </p>
          <div class="player-inv-card__actions">
            <button
              type="button"
              class="btn-primary btn-use-consumable"
              :disabled="player.hp >= player.maxHp && entry.flags.includes('heal_5')"
              @click="handleUse(entry.itemId)"
            >
              Utiliser
            </button>
          </div>
        </li>
      </ul>
    </section>

    <p v-if="totalItems > 0" class="player-sheet__total">
      Total sac : {{ totalItems }} objet(s)
    </p>

    <section v-if="player.flags.length" class="player-sheet__flags">
      <h3>Drapeaux</h3>
      <ul>
        <li v-for="flag in player.flags" :key="flag">{{ flag }}</li>
      </ul>
    </section>
  </AppModal>
</template>
