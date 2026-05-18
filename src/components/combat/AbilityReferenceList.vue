<script setup lang="ts">
import { computed } from 'vue'
import type { CombatAbility } from '../../types/combat'
import { formatPatternText, patternToSymbolTokens } from '../../combat/formatPattern'

const props = defineProps<{
  title: string
  abilities: CombatAbility[]
  side: 'hero' | 'enemy'
  highlightIds?: string[]
  dimmed?: boolean
}>()

const highlightSet = computed(() => new Set(props.highlightIds ?? []))
</script>

<template>
  <div
    class="ability-ref"
    :class="[
      `ability-ref--${side}`,
      { 'ability-ref--dimmed': dimmed },
    ]"
  >
    <h4 class="ability-ref__title">{{ title }}</h4>
    <ul class="ability-ref__list">
      <li
        v-for="ab in abilities"
        :key="ab.id"
        class="ability-ref__item"
        :class="{ 'ability-ref__item--active': highlightSet.has(ab.id) }"
      >
        <div class="ability-ref__head">
          <span class="ability-ref__name">{{ ab.name }}</span>
          <span class="ability-ref__dmg">{{ ab.damage }} PV</span>
        </div>
        <div class="ability-ref__pattern" aria-label="Combinaison">
          <span
            v-for="(sym, i) in patternToSymbolTokens(ab.pattern)"
            :key="i"
            class="ability-ref__symbol"
            :class="`ability-ref__symbol--${sym}`"
          >{{ sym === 'sword' ? '⚔' : sym === 'shield' ? '🛡' : '✦' }}</span>
          <span class="ability-ref__pattern-text">{{ formatPatternText(ab.pattern) }}</span>
        </div>
        <p class="ability-ref__desc">{{ ab.description }}</p>
      </li>
    </ul>
  </div>
</template>
