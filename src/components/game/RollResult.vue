<script setup lang="ts">
import type { StoredRoll } from '../../game/actionRollState'

defineProps<{
  roll: StoredRoll
}>()
</script>

<template>
  <div
    class="roll-result"
    :class="{
      'roll-result--success': roll.won === true,
      'roll-result--danger': roll.won === false,
    }"
  >
    <p class="roll-result__die">
      <span class="roll-result__value">{{ roll.value }}</span>
      <span class="roll-result__kind">
        {{ roll.kind === 'vigilance' ? 'd20' : 'd6' }}
      </span>
    </p>
    <div class="roll-result__text">
      <p v-for="(line, i) in roll.lines" :key="i">{{ line }}</p>
    </div>
  </div>
</template>
