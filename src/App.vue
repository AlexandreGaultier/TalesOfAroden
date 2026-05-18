<script setup lang="ts">
import { computed } from 'vue'
import GameBoard from './components/game/GameBoard.vue'
import TitleScreen from './components/game/TitleScreen.vue'
import { gamePhase } from './game/gameSession'

const showTitle = computed(() => gamePhase.value === 'title')
</script>

<template>
  <TitleScreen v-if="showTitle" />
  <GameBoard v-else />
</template>
