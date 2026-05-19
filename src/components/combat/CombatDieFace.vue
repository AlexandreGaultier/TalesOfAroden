<script setup lang="ts">
import { computed } from 'vue'
import { faceToSymbol, SYMBOL_META } from '../../combat/symbols'

const props = defineProps<{
  face: number
  /** Marqué pour être relancé. */
  selected?: boolean
  interactive?: boolean
}>()

const symbol = computed(() => faceToSymbol(props.face))
const label = computed(() => SYMBOL_META[symbol.value].label)
</script>

<template>
  <span
    class="combat-die-face"
    :class="[
      `combat-die-face--${symbol}`,
      { 'combat-die-face--selected': selected },
      { 'combat-die-face--interactive': interactive },
    ]"
    :title="label"
    :aria-label="label"
  >
    <span class="combat-die-face__glyph" aria-hidden="true">
      <template v-if="symbol === 'sword'">⚔</template>
      <template v-else-if="symbol === 'shield'">🛡</template>
      <template v-else>✦</template>
    </span>
  </span>
</template>
