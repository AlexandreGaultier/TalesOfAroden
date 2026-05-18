<script setup lang="ts">
import { computed } from 'vue'
import type { DialogueContent } from '../../types/game'
import {
  getAvailableChoices,
  getDialoguePicks,
  getPickedChoices,
  isDialogueComplete,
  pickDialogueChoice,
} from '../../game/dialogueState'
import { getPlayer } from '../../game/playerStore'
import { notifyPlayerUpdate, playerVersion } from '../../game/gameSession'

const props = defineProps<{
  content: DialogueContent
  subZoneId: string
  atPlace: boolean
}>()

const emit = defineEmits<{
  picked: []
}>()

const zoneId = computed(() => getPlayer().currentZoneId)

const picks = computed(() => {
  playerVersion.value
  return getDialoguePicks(zoneId.value, props.subZoneId)
})

const available = computed(() =>
  getAvailableChoices(props.content, picks.value),
)

const history = computed(() =>
  getPickedChoices(props.content, picks.value),
)

const complete = computed(() =>
  isDialogueComplete(zoneId.value, props.subZoneId),
)

function choose(choiceId: string): void {
  if (!props.atPlace) return
  pickDialogueChoice(zoneId.value, props.subZoneId, choiceId)
  notifyPlayerUpdate()
  emit('picked')
}
</script>

<template>
  <div class="dialogue-panel">
    <p class="dialogue-panel__speaker">{{ content.npcName }}</p>

    <div class="dialogue-panel__intro">
      <p v-for="(line, i) in content.intro" :key="`intro-${i}`" class="dialogue-panel__npc">
        {{ line }}
      </p>
    </div>

    <div v-for="choice in history" :key="choice.id" class="dialogue-panel__exchange">
      <p class="dialogue-panel__player">— {{ choice.label }}</p>
      <p
        v-for="(line, i) in choice.npcReply"
        :key="`${choice.id}-${i}`"
        class="dialogue-panel__npc"
      >
        {{ line }}
      </p>
    </div>

    <div v-if="atPlace && available.length" class="dialogue-panel__choices">
      <span class="dialogue-panel__choices-label">Vos réponses</span>
      <button
        v-for="choice in available"
        :key="choice.id"
        type="button"
        class="dialogue-choice"
        @click="choose(choice.id)"
      >
        {{ choice.label }}
      </button>
    </div>

    <p v-else-if="atPlace && !complete" class="dialogue-panel__hint">
      Continuez la conversation pour débloquer les chemins.
    </p>

    <p v-else-if="complete" class="dialogue-panel__done">
      Vous avez tout appris ici. Les chemins sont dégagés.
    </p>

    <p v-else class="dialogue-panel__muted">
      Rendez-vous sur ce lieu pour parler.
    </p>
  </div>
</template>
