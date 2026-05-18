<script setup lang="ts">
import { SYMBOL_META, SYMBOL_ORDER } from '../../combat/symbols'

function glyph(sym: (typeof SYMBOL_ORDER)[number]): string {
  return SYMBOL_META[sym].short
}
</script>

<template>
  <div class="combat-symbol-legend" aria-label="Légende des symboles de dés">
    <span
      v-for="sym in SYMBOL_ORDER"
      :key="sym"
      class="combat-symbol-legend__item"
    >
      <span
        class="combat-symbol-legend__chip"
        :class="`combat-symbol-legend__chip--${sym}`"
      >{{ glyph(sym) }}</span>
      <span class="combat-symbol-legend__label">
        {{ SYMBOL_META[sym].label }}
        <span class="combat-symbol-legend__faces">
          ({{ SYMBOL_META[sym].faces.join('·') }})
        </span>
      </span>
    </span>
  </div>
</template>
