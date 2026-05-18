<script setup lang="ts">
import { restartGame, returnToTitleScreen } from '../../game/gameSession'

function handleRestart(): void {
  restartGame()
}

function handleChangeHero(): void {
  returnToTitleScreen()
}
</script>

<template>
  <div class="death-modal" role="alertdialog" aria-modal="true" aria-labelledby="death-title">
    <div class="death-modal__panel">
      <p class="death-modal__eyebrow">Fin de l'aventure</p>
      <h2 id="death-title" class="death-modal__title">Vous avez péri</h2>
      <p class="death-modal__text">
        Le sol de la forêt absorbe le dernier souffle du voyageur. Les ombres
        se referment sur vos pas ; les chemins que vous aviez ouverts
        retournent au silence. Aroden ne retient que l'écho d'une brève
        passage — et le vent, qui efface déjà votre trace.
      </p>
      <p class="death-modal__text death-modal__text--muted">
        Une nouvelle aventure vous attend. Reprenez le fil du récit depuis le
        sanctuaire, si le destin vous en accorde encore une chance.
      </p>
      <button type="button" class="death-modal__btn" @click="handleRestart">
        Recommencer avec ce personnage
      </button>
      <button
        type="button"
        class="death-modal__btn death-modal__btn--secondary"
        @click="handleChangeHero"
      >
        Choisir un autre personnage
      </button>
    </div>
  </div>
</template>
