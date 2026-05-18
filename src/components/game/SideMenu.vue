<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  currentZone,
  openJournalModal,
  openPlayerModal,
  playerVersion,
  restartGame,
  returnToTitleScreen,
  saveGame,
} from '../../game/gameSession'
import { getPlayer, playerRevision } from '../../game/playerStore'

const player = computed(() => {
  playerVersion.value
  playerRevision.value
  return getPlayer()
})

const saveHint = ref('')

let saveHintTimer: ReturnType<typeof setTimeout> | null = null

function handleSave(): void {
  const ok = saveGame()
  saveHint.value = ok ? 'Sauvegardé !' : 'Erreur'
  if (saveHintTimer) clearTimeout(saveHintTimer)
  saveHintTimer = setTimeout(() => {
    saveHint.value = ''
  }, 2200)
}

function handleReturnToTitle(): void {
  if (!confirm('Retour à l\'écran titre ? La partie sera sauvegardée.')) return
  returnToTitleScreen()
}
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
        <span class="side-menu__btn-hint">{{ player.name }} · {{ player.hp }} / {{ player.maxHp }} PV</span>
      </button>
      <button type="button" class="side-menu__btn" @click="openJournalModal">
        <span class="side-menu__btn-label">Journal</span>
        <span class="side-menu__btn-hint">Chronique d'aventure</span>
      </button>
    </nav>

    <footer class="side-menu__footer">
      <button type="button" class="side-menu__btn side-menu__btn--save" @click="handleSave">
        <span class="side-menu__btn-label">Sauvegarder</span>
        <span class="side-menu__btn-hint">
          {{ saveHint || 'Partie, journal et progression' }}
        </span>
      </button>
      <button type="button" class="side-menu__btn side-menu__btn--ghost" @click="restartGame">
        Nouvelle partie
      </button>
      <button
        type="button"
        class="side-menu__btn side-menu__btn--ghost side-menu__btn--link"
        @click="handleReturnToTitle"
      >
        Changer de personnage
      </button>
    </footer>
  </aside>
</template>
