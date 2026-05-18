<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { INITIATIVE_DURATION_MS } from '../../combat/engine'

const props = defineProps<{
  heroRoll: number
  enemyRoll: number
  heroName: string
  enemyName: string
}>()

const emit = defineEmits<{
  complete: []
}>()

type Phase = 'rolling' | 'reveal' | 'winner'

const phase = ref<Phase>('rolling')
const displayHero = ref(1)
const displayEnemy = ref(1)

const firstAttacker = computed((): 'hero' | 'enemy' =>
  props.heroRoll >= props.enemyRoll ? 'hero' : 'enemy',
)

const winnerLabel = computed(() => {
  if (firstAttacker.value === 'hero') return `${props.heroName} — vous attaquez en premier !`
  return `${props.enemyName} attaque en premier !`
})

let rollInterval: ReturnType<typeof setInterval> | null = null
let revealTimer: ReturnType<typeof setTimeout> | null = null
let winnerTimer: ReturnType<typeof setTimeout> | null = null
let completeTimer: ReturnType<typeof setTimeout> | null = null

function randomD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

onMounted(() => {
  rollInterval = setInterval(() => {
    displayHero.value = randomD20()
    displayEnemy.value = randomD20()
  }, 70)

  const revealAt = INITIATIVE_DURATION_MS * 0.45
  const winnerAt = INITIATIVE_DURATION_MS * 0.72

  revealTimer = setTimeout(() => {
    if (rollInterval) clearInterval(rollInterval)
    rollInterval = null
    displayHero.value = props.heroRoll
    displayEnemy.value = props.enemyRoll
    phase.value = 'reveal'
  }, revealAt)

  winnerTimer = setTimeout(() => {
    phase.value = 'winner'
  }, winnerAt)

  completeTimer = setTimeout(() => {
    emit('complete')
  }, INITIATIVE_DURATION_MS)
})

onUnmounted(() => {
  if (rollInterval) clearInterval(rollInterval)
  if (revealTimer) clearTimeout(revealTimer)
  if (winnerTimer) clearTimeout(winnerTimer)
  if (completeTimer) clearTimeout(completeTimer)
})
</script>

<template>
  <div
    class="combat-initiative-roll"
    :class="`combat-initiative-roll--${phase}`"
  >
    <p class="combat-initiative-roll__title">Jet d'initiative — 1d20</p>

    <div class="combat-initiative-roll__arena">
      <div
        class="combat-initiative-roll__fighter combat-initiative-roll__fighter--hero"
        :class="{
          'combat-initiative-roll__fighter--lead':
            phase !== 'rolling' && firstAttacker === 'hero',
          'combat-initiative-roll__fighter--rolling': phase === 'rolling',
        }"
      >
        <span class="combat-initiative-roll__label">Vous</span>
        <strong
          class="combat-initiative-roll__value"
          :class="{ 'combat-initiative-roll__value--spin': phase === 'rolling' }"
        >
          {{ displayHero }}
        </strong>
      </div>

      <span class="combat-initiative-roll__vs">VS</span>

      <div
        class="combat-initiative-roll__fighter combat-initiative-roll__fighter--enemy"
        :class="{
          'combat-initiative-roll__fighter--lead':
            phase !== 'rolling' && firstAttacker === 'enemy',
          'combat-initiative-roll__fighter--rolling': phase === 'rolling',
        }"
      >
        <span class="combat-initiative-roll__label">{{ enemyName }}</span>
        <strong
          class="combat-initiative-roll__value"
          :class="{ 'combat-initiative-roll__value--spin': phase === 'rolling' }"
        >
          {{ displayEnemy }}
        </strong>
      </div>
    </div>

    <p
      v-if="phase === 'winner'"
      class="combat-initiative-roll__winner"
      :class="`combat-initiative-roll__winner--${firstAttacker}`"
    >
      {{ winnerLabel }}
    </p>
    <p v-else-if="phase === 'rolling'" class="combat-initiative-roll__hint">
      Les dés roulent…
    </p>
    <p v-else class="combat-initiative-roll__hint">Résultat !</p>
  </div>
</template>
