<script setup lang="ts">
import { computed } from 'vue'
import { closeModal, playerVersion } from '../../game/gameSession'
import { getPlayer, playerRevision } from '../../game/playerStore'
import AppModal from './AppModal.vue'

const player = computed(() => {
  playerVersion.value
  playerRevision.value
  return getPlayer()
})
</script>

<template>
  <AppModal title="Personnage" @close="closeModal">
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
        <dt>Position</dt>
        <dd class="player-sheet__mono">{{ player.currentZoneId }} / {{ player.currentSubZoneId }}</dd>
      </div>
      <div class="player-sheet__row">
        <dt>Lieux explorés</dt>
        <dd>{{ player.exploredSubZones.length }}</dd>
      </div>
    </dl>

    <section v-if="player.flags.length" class="player-sheet__flags">
      <h3>Drapeaux</h3>
      <ul>
        <li v-for="flag in player.flags" :key="flag">{{ flag }}</li>
      </ul>
    </section>
    <p v-else class="player-sheet__empty">Aucun drapeau pour l'instant.</p>
  </AppModal>
</template>
