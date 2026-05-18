<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { isCombatOpen } from '../../combat/combatStore'
import { activeModal, initSession, isPlayerDead } from '../../game/gameSession'
import DeathModal from './DeathModal.vue'
import CombatOverlay from '../combat/CombatOverlay.vue'
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
    <CombatOverlay v-if="isCombatOpen" />
    <DeathModal v-if="isPlayerDead" />
  </div>
</template>
