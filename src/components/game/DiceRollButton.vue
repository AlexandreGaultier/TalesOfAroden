<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  label: string
  sides: 6 | 20
  variant?: 'combat' | 'check'
  disabled?: boolean
  /** Valeur figée après un jet (masque le bouton côté parent). */
  settledValue?: number | null
}>()

const emit = defineEmits<{
  rolled: [value: number]
}>()

const rolling = ref(false)
const displayValue = ref<number | null>(null)

watch(
  () => props.settledValue,
  (v) => {
    if (v != null) displayValue.value = v
  },
  { immediate: true },
)

function randomFace(): number {
  return Math.floor(Math.random() * props.sides) + 1
}

function handleClick(): void {
  if (rolling.value || props.disabled || props.settledValue != null) return

  const finalResult = randomFace()
  rolling.value = true
  displayValue.value = null

  let ticks = 0
  const maxTicks = 14
  const interval = window.setInterval(() => {
    ticks += 1
    displayValue.value =
      ticks >= maxTicks ? finalResult : randomFace()
    if (ticks >= maxTicks) {
      window.clearInterval(interval)
      rolling.value = false
      emit('rolled', finalResult)
    }
  }, 70)
}
</script>

<template>
  <button
    type="button"
    class="dice-btn"
    :class="[
      variant === 'check' ? 'dice-btn--check' : 'dice-btn--combat',
      { 'dice-btn--rolling': rolling },
    ]"
    :disabled="disabled || rolling || settledValue != null"
    @click="handleClick"
  >
    <span class="dice-btn__cube" aria-hidden="true">
      <span class="dice-btn__face">{{ displayValue ?? '?' }}</span>
    </span>
    <span class="dice-btn__label">{{ label }}</span>
  </button>
</template>
