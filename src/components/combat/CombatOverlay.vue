<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  closeCombat,
  confirmPlayerRoll,
  enemyDef,
  enemyMatchingAbilities,
  heroDef,
  matchingAbilities,
  playerPassTurn,
  playerReroll,
  playerUseAbility,
  session,
  toggleDieLock,
} from '../../combat/combatStore'
import { notifyPlayerUpdate, isPlayerDead } from '../../game/gameSession'
import CombatInitiativeRoll from './CombatInitiativeRoll.vue'
import { countSymbolsFromDice, formatSymbolCounts } from '../../combat/symbols'
import AbilityReferenceList from './AbilityReferenceList.vue'
import CombatDieFace from './CombatDieFace.vue'
import CombatLogPanel from './CombatLogPanel.vue'
import CombatSymbolLegend from './CombatSymbolLegend.vue'
import { formatPatternText } from '../../combat/formatPattern'

const showInitiative = ref(true)

const s = computed(() => session.value)

watch(
  () => s.value?.initiativeShownAt,
  (at) => {
    if (at) showInitiative.value = true
  },
  { immediate: true },
)

const phase = computed(() => s.value?.phase ?? 'ended')

const turnLabel = computed(() => {
  if (!s.value) return ''
  if (phase.value === 'initiative') return 'Initiative'
  if (phase.value === 'ended') {
    return s.value.winner === 'hero' ? 'Victoire' : 'Défaite'
  }
  if (s.value.activeSide === 'hero') return 'Votre tour'
  return `Tour — ${s.value.enemy.name}`
})

const turnSide = computed((): 'hero' | 'enemy' | 'neutral' => {
  if (phase.value === 'initiative' || phase.value === 'ended') return 'neutral'
  return s.value?.activeSide ?? 'neutral'
})

const heroHighlightIds = computed(() => {
  if (phase.value === 'player_ability') {
    return matchingAbilities.value.map((a) => a.id)
  }
  return []
})

const enemyHighlightIds = computed(() => {
  if (phase.value === 'enemy_turn') {
    if (enemyMatchingAbilities.value.length) {
      return enemyMatchingAbilities.value.map((a) => a.id)
    }
    if (s.value?.lastEnemyAbilityId) return [s.value.lastEnemyAbilityId]
  }
  return []
})

const isHeroTurn = computed(
  () =>
    phase.value === 'player_roll' ||
    phase.value === 'player_ability',
)

const isEnemyTurn = computed(() => phase.value === 'enemy_turn')

const diceSymbolSummary = computed(() => {
  if (!s.value?.dice.length) return ''
  return formatSymbolCounts(countSymbolsFromDice(s.value.dice))
})

function handleClose(): void {
  if (s.value?.phase === 'ended') {
    closeCombat()
    notifyPlayerUpdate()
  }
}
</script>

<template>
  <div v-if="s && heroDef && enemyDef" class="combat-overlay">
    <header class="combat-overlay__header">
      <div>
        <p class="combat-overlay__eyebrow">Combat de dés</p>
        <h2>{{ s.context.introTitle }}</h2>
      </div>
      <button
        v-if="phase === 'ended' && !isPlayerDead"
        type="button"
        class="combat-overlay__close"
        @click="handleClose"
      >
        Fermer
      </button>
    </header>

    <div class="combat-overlay__body">
      <div class="combat-overlay__left">
        <div class="combat-status-row">
          <div
            class="combat-turn-pill"
            :class="[
              `combat-turn-pill--${turnSide}`,
              { 'combat-turn-pill--pulse': isHeroTurn || isEnemyTurn },
            ]"
          >
            <span class="combat-turn-pill__dot" />
            {{ turnLabel }}
          </div>

          <div class="combat-hp-strip">
            <div
              class="combat-hp-card combat-hp-card--hero"
              :class="{ 'combat-hp-card--active': isHeroTurn }"
            >
              <div class="combat-hp-card__top">
                <span class="combat-hp-card__name">{{ s.hero.name }}</span>
                <span class="combat-hp-card__values">
                  {{ s.hero.hp }} / {{ s.hero.maxHp }}
                </span>
              </div>
              <div class="combat-hp-card__bar" role="progressbar">
                <span
                  class="combat-hp-card__fill combat-hp-card__fill--hero"
                  :style="{ width: `${(s.hero.hp / s.hero.maxHp) * 100}%` }"
                />
              </div>
            </div>

            <span class="combat-hp-strip__vs">VS</span>

            <div
              class="combat-hp-card combat-hp-card--enemy"
              :class="{ 'combat-hp-card--active': isEnemyTurn }"
            >
              <div class="combat-hp-card__top">
                <span class="combat-hp-card__name">{{ s.enemy.name }}</span>
                <span class="combat-hp-card__values">
                  {{ s.enemy.hp }} / {{ s.enemy.maxHp }}
                </span>
              </div>
              <div class="combat-hp-card__bar" role="progressbar">
                <span
                  class="combat-hp-card__fill combat-hp-card__fill--enemy"
                  :style="{ width: `${(s.enemy.hp / s.enemy.maxHp) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <section class="combat-actions-panel">
          <CombatSymbolLegend />

          <CombatInitiativeRoll
            v-if="showInitiative && s.initiative && phase === 'initiative'"
            :hero-roll="s.initiative.hero"
            :enemy-roll="s.initiative.enemy"
            :hero-name="s.hero.name"
            :enemy-name="enemyDef.name"
            @complete="showInitiative = false"
          />

          <div v-else-if="phase === 'player_roll'" class="combat-phase">
            <p class="combat-phase__hint">
              Cliquez sur un dé pour le <strong>verrouiller</strong>.
              Relances : <strong>{{ s.rerollsLeft }}</strong> / 2
            </p>
            <div class="combat-dice">
              <button
                v-for="(die, i) in s.dice"
                :key="i"
                type="button"
                class="combat-die-btn"
                :class="{ 'combat-die-btn--locked': s.locked[i] }"
                @click="toggleDieLock(i)"
              >
                <CombatDieFace :face="die" :locked="s.locked[i]" interactive />
              </button>
            </div>
            <p v-if="diceSymbolSummary" class="combat-phase__summary">
              Résumé : {{ diceSymbolSummary }}
            </p>
            <div class="combat-phase__actions">
              <button
                type="button"
                class="btn-secondary"
                :disabled="s.rerollsLeft <= 0"
                @click="playerReroll"
              >
                Relancer les dés libres
              </button>
              <button type="button" class="btn-primary" @click="confirmPlayerRoll">
                Valider les dés
              </button>
            </div>
          </div>

          <div v-else-if="phase === 'player_ability'" class="combat-phase">
            <p class="combat-phase__hint">Vos dés</p>
            <div class="combat-dice combat-dice--readonly">
              <CombatDieFace
                v-for="(die, i) in s.dice"
                :key="i"
                :face="die"
              />
            </div>
            <p class="combat-phase__summary">{{ diceSymbolSummary }}</p>

            <div v-if="matchingAbilities.length" class="combat-abilities-pick">
              <p class="combat-abilities-pick__label">
                Capacités disponibles — cliquez pour agir
              </p>
              <button
                v-for="ab in matchingAbilities"
                :key="ab.id"
                type="button"
                class="combat-ability-btn"
                @click="playerUseAbility(ab.id)"
              >
                <span class="combat-ability-btn__left">
                  <span class="combat-ability-btn__name">{{ ab.name }}</span>
                  <span class="combat-ability-btn__pattern">
                    {{ formatPatternText(ab.pattern) }}
                  </span>
                </span>
                <span class="combat-ability-btn__dmg">{{ ab.damage }} PV</span>
              </button>
            </div>
            <p v-else class="combat-phase__warn">
              Aucune combinaison ne correspond — vous perdez votre tour.
            </p>
            <button type="button" class="btn-secondary" @click="playerPassTurn">
              {{ matchingAbilities.length ? 'Passer' : 'Fin du tour' }}
            </button>
          </div>

          <div v-else-if="phase === 'enemy_turn'" class="combat-phase combat-phase--enemy">
            <p class="combat-phase__hint">
              <template v-if="s.dice.length">
                {{ enemyDef.name }} a lancé
              </template>
              <template v-else>
                {{ enemyDef.name }} prépare son attaque…
              </template>
            </p>
            <div v-if="s.dice.length" class="combat-dice combat-dice--readonly">
              <CombatDieFace
                v-for="(die, i) in s.dice"
                :key="i"
                :face="die"
              />
            </div>
            <p v-if="diceSymbolSummary" class="combat-phase__summary">
              {{ diceSymbolSummary }}
            </p>
            <p
              v-if="enemyMatchingAbilities.length"
              class="combat-phase__enemy-action"
            >
              Capacité activée mise en surbrillance ci-dessous ↓
            </p>
          </div>

          <div v-else-if="phase === 'ended'" class="combat-phase combat-phase--end">
            <p
              v-if="s.winner === 'hero'"
              class="combat-end combat-end--win"
            >
              Victoire !
            </p>
            <p v-else class="combat-end combat-end--lose">Défaite…</p>
          </div>
        </section>

        <div class="combat-abilities-grid">
          <AbilityReferenceList
            title="Vos compétences"
            :abilities="heroDef.abilities"
            side="hero"
            :highlight-ids="heroHighlightIds"
            :dimmed="isEnemyTurn"
          />
          <AbilityReferenceList
            :title="`Compétences — ${enemyDef.name}`"
            :abilities="enemyDef.abilities"
            side="enemy"
            :highlight-ids="enemyHighlightIds"
            :dimmed="isHeroTurn"
          />
        </div>
      </div>

      <aside class="combat-overlay__journal">
        <CombatLogPanel :entries="s.log" />
      </aside>
    </div>
  </div>
</template>
