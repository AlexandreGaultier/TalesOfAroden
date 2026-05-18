<script setup lang="ts">
import { computed } from 'vue'
import {
  currentZone,
  openJournalModal,
  openPlayerModal,
  playerVersion,
  restartGame,
} from '../../game/gameSession'
import { getPlayer } from '../../game/playerStore'

const player = computed(() => {
  playerVersion.value
  return getPlayer()
})
</script>

<template>
  <aside class="side-menu">
    <div class="side-menu__brand">
      <span class="side-menu__title">Tales of Aroden</span>
      <span v-if="currentZone" class="side-menu__zone">{{ currentZone.name }}</span>
    </div>

    <nav class="side-menu__nav">
      <button type="button" class="side-menu__btn" @click="openPlayerModal">
        <span class="side-menu__btn-label">Personnage</span>
        <span class="side-menu__btn-hint">{{ player.hp }} / {{ player.maxHp }} PV</span>
      </button>
      <button type="button" class="side-menu__btn" @click="openJournalModal">
        <span class="side-menu__btn-label">Journal</span>
        <span class="side-menu__btn-hint">Chronique d'aventure</span>
      </button>
    </nav>

    <footer class="side-menu__footer">
      <button type="button" class="side-menu__btn side-menu__btn--ghost" @click="restartGame">
        Nouvelle partie
      </button>
    </footer>
  </aside>
</template>
