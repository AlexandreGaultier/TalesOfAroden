<script setup lang="ts">
import type { CombatLogEntry } from '../../types/combat'

defineProps<{
  entries: CombatLogEntry[]
}>()
</script>

<template>
  <div class="combat-log-panel">
    <h3 class="combat-log-panel__title">Journal de combat</h3>
    <div class="combat-log-panel__scroll">
      <p
        v-for="(entry, i) in entries"
        :key="i"
        class="combat-log-entry"
        :class="`combat-log-entry--${entry.kind}`"
      >
        {{ entry.message }}
      </p>
      <p v-if="!entries.length" class="combat-log-panel__empty">
        Le combat commence…
      </p>
    </div>
  </div>
</template>
