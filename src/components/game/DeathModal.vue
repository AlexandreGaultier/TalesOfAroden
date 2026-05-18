<script setup lang="ts">
import { restartGame } from '../../game/gameSession'

function handleRestart(): void {
  restartGame()
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
        Recommencer l'aventure
      </button>
    </div>
  </div>
</template>
