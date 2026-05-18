<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { activeModal, initSession } from '../../game/gameSession'
import JournalModal from './JournalModal.vue'
import PlayerModal from './PlayerModal.vue'
import SideMenu from './SideMenu.vue'
import SubZoneModal from './SubZoneModal.vue'
import ZoneMap from './ZoneMap.vue'

onMounted(() => {
  initSession()
})

const showPlayer = computed(() => activeModal.value === 'player')
const showJournal = computed(() => activeModal.value === 'journal')
const showSubZone = computed(() => activeModal.value === 'subzone')
</script>

<template>
  <div class="game-layout">
    <SideMenu />

    <main class="game-main">
      <ZoneMap />
    </main>

    <PlayerModal v-if="showPlayer" />
    <JournalModal v-if="showJournal" />
    <SubZoneModal v-if="showSubZone" />
  </div>
</template>
