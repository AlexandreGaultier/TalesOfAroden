<script setup lang="ts">
import { clearJournal, journal } from '../../game/journal'
import { closeModal } from '../../game/gameSession'
import AppModal from './AppModal.vue'
</script>

<template>
  <AppModal title="Journal" wide @close="closeModal">
    <div class="journal-modal">
      <div class="journal-modal__actions">
        <button type="button" class="btn-secondary" @click="clearJournal">
          Effacer le journal
        </button>
      </div>
      <div v-if="journal.length" class="journal-modal__entries">
        <p v-for="(line, index) in journal" :key="index" class="journal-modal__line">
          {{ line }}
        </p>
      </div>
      <p v-else class="journal-modal__empty">
        Votre chronique est vide. Explorez la carte et interagissez avec les lieux.
      </p>
    </div>
  </AppModal>
</template>
