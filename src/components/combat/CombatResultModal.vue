<script setup lang="ts">
import { computed } from 'vue'
import { closeCombat, enemyDef, lastCombatLoot, session } from '../../combat/combatStore'
import { getItem } from '../../game/itemRegistry'
import { notifyPlayerUpdate } from '../../game/gameSession'

const s = computed(() => session.value)
const isWin = computed(() => s.value?.winner === 'hero')

const title = computed(() => (isWin.value ? 'Victoire !' : 'Défaite…'))

const message = computed(() => {
  if (!s.value) return ''
  if (isWin.value) {
    return `Vous avez triomphé de ${s.value.enemy.name}. Les chemins se rouvrent devant vous.`
  }
  return `Vous avez été vaincu par ${s.value.enemy.name}.`
})

const combatLoot = computed(() => lastCombatLoot.value)

const lootWithDetails = computed(() =>
  combatLoot.value.map((grant) => {
    const def = getItem(grant.itemId)
    return {
      ...grant,
      description: def?.description ?? '',
      category: def?.category ?? 'loot',
    }
  }),
)

function handleClose(): void {
  closeCombat()
  notifyPlayerUpdate()
}
</script>

<template>
  <div
    v-if="s && s.phase === 'ended'"
    class="combat-result-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="combat-result-title"
  >
    <div
      class="combat-result-modal__panel"
      :class="{
        'combat-result-modal__panel--win': isWin,
        'combat-result-modal__panel--lose': !isWin,
      }"
    >
      <p class="combat-result-modal__eyebrow">Combat terminé</p>
      <h2 id="combat-result-title" class="combat-result-modal__title">
        {{ title }}
      </h2>
      <p class="combat-result-modal__text">{{ message }}</p>
      <p v-if="enemyDef && isWin" class="combat-result-modal__enemy">
        {{ enemyDef.name }} — 0 PV
      </p>

      <section v-if="isWin" class="combat-result-modal__loot-section">
        <h3 class="combat-result-modal__loot-title">Butin récupéré</h3>
        <p v-if="!lootWithDetails.length" class="combat-result-modal__loot-empty">
          Aucun objet cette fois — la victoire reste précieuse.
        </p>
        <ul v-else class="combat-result-modal__loot-list">
          <li
            v-for="entry in lootWithDetails"
            :key="entry.itemId"
            class="combat-loot-item"
            :class="`combat-loot-item--${entry.category}`"
          >
            <span class="combat-loot-item__qty">{{ entry.quantity }}×</span>
            <span class="combat-loot-item__name">{{ entry.name }}</span>
            <p v-if="entry.description" class="combat-loot-item__desc">
              {{ entry.description }}
            </p>
          </li>
        </ul>
        <p class="combat-result-modal__loot-hint">
          Consultez l'inventaire dans le menu Personnage.
        </p>
      </section>

      <button type="button" class="combat-result-modal__btn" @click="handleClose">
        Fermer
      </button>
    </div>
  </div>
</template>
