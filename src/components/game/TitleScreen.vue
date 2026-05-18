<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { gamePhase } from '../../game/gameSession'
import {
  createAndStartCharacter,
  listCharacters,
  removeCharacter,
  startCharacter,
} from '../../game/gameSession'
import type { CharacterListItem } from '../../types/save'
import { getZone } from '../../game/zoneRegistry'

const characters = ref<CharacterListItem[]>(listCharacters())
const newName = ref('')
const showCreate = ref(false)
const error = ref('')

function refreshList(): void {
  characters.value = listCharacters()
}

function zoneLabel(zoneId: string): string {
  return getZone(zoneId)?.name ?? zoneId
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function handlePlay(id: string): void {
  if (!startCharacter(id)) {
    error.value = 'Impossible de charger ce personnage.'
    refreshList()
  }
}

function handleCreate(): void {
  error.value = ''
  const name = newName.value.trim()
  if (!name) {
    error.value = 'Donnez un nom à votre personnage.'
    return
  }
  if (!createAndStartCharacter(name)) {
    error.value = 'Création impossible.'
    return
  }
  newName.value = ''
  showCreate.value = false
}

function handleDelete(id: string, name: string): void {
  if (!confirm(`Supprimer la sauvegarde de « ${name} » ?`)) return
  removeCharacter(id)
  refreshList()
}

function toggleCreate(): void {
  showCreate.value = !showCreate.value
  error.value = ''
}

onMounted(() => {
  refreshList()
})

watch(
  () => gamePhase.value,
  (phase) => {
    if (phase === 'title') refreshList()
  },
)
</script>

<template>
  <div class="title-screen">
    <header class="title-screen__header">
      <p class="title-screen__eyebrow">Jeu narratif</p>
      <h1 class="title-screen__title">Tales of Aroden</h1>
      <p class="title-screen__subtitle">
        Choisissez un héros ou forgez une nouvelle légende.
      </p>
    </header>

    <section class="title-screen__panel">
      <h2 class="title-screen__panel-title">Vos personnages</h2>

      <p v-if="!characters.length" class="title-screen__empty">
        Aucune sauvegarde — créez votre premier voyageur.
      </p>

      <ul v-else class="title-screen__list">
        <li v-for="char in characters" :key="char.id" class="title-card">
          <button
            type="button"
            class="title-card__play"
            @click="handlePlay(char.id)"
          >
            <span class="title-card__name">{{ char.name }}</span>
            <span class="title-card__meta">
              {{ char.hp }} / {{ char.maxHp }} PV · {{ zoneLabel(char.zoneId) }}
            </span>
            <span class="title-card__date">
              Dernière partie : {{ formatDate(char.updatedAt) }}
            </span>
          </button>
          <button
            type="button"
            class="title-card__delete"
            aria-label="Supprimer"
            title="Supprimer"
            @click.stop="handleDelete(char.id, char.name)"
          >
            ×
          </button>
        </li>
      </ul>

      <p v-if="error" class="title-screen__error">{{ error }}</p>

      <div v-if="showCreate" class="title-screen__create">
        <label class="title-screen__label" for="new-hero-name">Nom du personnage</label>
        <input
          id="new-hero-name"
          v-model="newName"
          type="text"
          class="title-screen__input"
          maxlength="32"
          placeholder="Ex. Elara, Thorne…"
          @keyup.enter="handleCreate"
        />
        <div class="title-screen__create-actions">
          <button type="button" class="btn-secondary" @click="toggleCreate">
            Annuler
          </button>
          <button type="button" class="btn-primary" @click="handleCreate">
            Commencer l'aventure
          </button>
        </div>
      </div>

      <button
        v-else
        type="button"
        class="title-screen__new btn-primary"
        @click="toggleCreate"
      >
        + Nouveau personnage
      </button>
    </section>
  </div>
</template>
