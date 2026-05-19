<script setup lang="ts">
import { computed } from 'vue'
import { closeModal, playerVersion } from '../../game/gameSession'
import {
  getInventoryDetails,
  getInventoryTotalItems,
} from '../../game/inventory'
import { getPlayer, playerRevision } from '../../game/playerStore'
import AppModal from './AppModal.vue'

const player = computed(() => {
  playerVersion.value
  playerRevision.value
  return getPlayer()
})

const inventory = computed(() => {
  playerVersion.value
  playerRevision.value
  return getInventoryDetails()
})

const totalItems = computed(() => {
  playerVersion.value
  playerRevision.value
  return getInventoryTotalItems()
})

const categoryLabel: Record<string, string> = {
  loot: 'Butin',
  gather: 'Récolte',
  unknown: 'Autre',
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

    <section class="player-sheet__inventory">
      <div class="player-sheet__inventory-head">
        <h3>Inventaire</h3>
        <span v-if="inventory.length" class="player-sheet__inventory-meta">
          {{ inventory.length }} type(s) · {{ totalItems }} objet(s)
        </span>
      </div>

      <p v-if="!inventory.length" class="player-sheet__empty">
        Votre sac est vide. Le butin des combats et vos trouvailles s'afficheront ici.
      </p>

      <ul v-else class="player-sheet__inv-full">
        <li
          v-for="entry in inventory"
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

    <section v-if="player.flags.length" class="player-sheet__flags">
      <h3>Drapeaux</h3>
      <ul>
        <li v-for="flag in player.flags" :key="flag">{{ flag }}</li>
      </ul>
    </section>
  </AppModal>
</template>
