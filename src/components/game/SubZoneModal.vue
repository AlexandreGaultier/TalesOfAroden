<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  isCombatContent,
  isDialogueContent,
  isDungeonContent,
  isExitContent,
  isMerchantContent,
  isNarrativeContent,
} from '../../types/game'
import {
  canShowPathsInModal,
  canTravelTo,
  closeModal,
  getRollState,
  getTravelOptions,
  goToSubZone,
  hasVigilanceRoll,
  isAtLocation,
  isCombatCleared,
  modalSubZone,
  needsRematchCheck,
  playerVersion,
  engageDiceCombat,
  isCombatOpen,
  runRematchCheck,
  travelTo,
  tryUseExit,
} from '../../game/gameSession'
import { ZONE_TYPE_LABELS } from '../../game/zoneTypes'
import AppModal from './AppModal.vue'
import DialoguePanel from './DialoguePanel.vue'
import DiceRollButton from './DiceRollButton.vue'
import RollResult from './RollResult.vue'

const exitMessage = ref<string | null>(null)

const subZone = modalSubZone

const typeLabel = computed(() =>
  subZone.value ? ZONE_TYPE_LABELS[subZone.value.type] : '',
)

const travelOptions = computed(() => {
  if (!subZone.value) return []
  return getTravelOptions(subZone.value.id).filter(
    (opt) => opt.target.id !== subZone.value!.id,
  )
})

const atThisPlace = computed(() =>
  subZone.value ? isAtLocation(subZone.value.id) : false,
)

const showPaths = computed(() => {
  playerVersion.value
  return subZone.value ? canShowPathsInModal(subZone.value.id) : false
})

const rollState = computed(() => {
  playerVersion.value
  return subZone.value ? getRollState(subZone.value.id) : {}
})

const combatContent = computed(() => {
  if (!subZone.value || !isCombatContent(subZone.value.content)) return null
  return subZone.value.content
})

const combatCleared = computed(() => {
  playerVersion.value
  return subZone.value ? isCombatCleared(subZone.value.id) : false
})

const showRematchCheck = computed(() =>
  subZone.value ? needsRematchCheck(subZone.value.id) : false,
)

const showCombatButton = computed(() => {
  if (!atThisPlace.value || !combatContent.value) return false
  if (combatCleared.value && !rollState.value.rematchTriggered) return false
  if (showRematchCheck.value) return false
  const combat = rollState.value.combat
  if (!combat) return true
  return combat.won === false
})

const combatTitle = computed(() => {
  if (!combatContent.value) return ''
  const rematch =
    rollState.value.rematchTriggered ||
    (rollState.value.combat && !combatCleared.value && hasVigilanceRoll(subZone.value?.id ?? ''))
  return rematch ? combatContent.value.rematchTitle : combatContent.value.title
})

const showActionSection = computed(() => {
  if (!subZone.value) return false
  if (isCombatContent(subZone.value.content)) {
    return (
      showRematchCheck.value ||
      showCombatButton.value ||
      !!rollState.value.vigilance ||
      !!rollState.value.combat
    )
  }
  if (isDialogueContent(subZone.value.content) && atThisPlace.value) return true
  if (isExitContent(subZone.value.content)) return true
  if (isMerchantContent(subZone.value.content) && atThisPlace.value) return true
  return false
})

watch(
  () => subZone.value?.id,
  () => {
    exitMessage.value = null
  },
)

function engageCombat(): void {
  if (!subZone.value) return
  const subZoneId = subZone.value.id
  const rematch = rollState.value.rematchTriggered ?? false
  closeModal()
  engageDiceCombat(subZoneId, rematch)
}

function onRematchCheckRolled(value: number): void {
  if (!subZone.value) return
  runRematchCheck(subZone.value.id, value)
}

function handleExit(): void {
  if (!subZone.value) return
  exitMessage.value = tryUseExit(subZone.value.id).join(' ')
}

function handleTravel(targetId: string): void {
  travelTo(targetId)
}

function handleGoHere(): void {
  if (!subZone.value) return
  goToSubZone(subZone.value.id)
}
</script>

<template>
  <AppModal
    v-if="subZone"
    :title="subZone.name"
    wide
    @close="closeModal"
  >
    <div class="subzone-modal" :data-zone-type="subZone.type">
      <section class="subzone-modal__story">
        <span class="subzone-modal__story-label">Récit</span>
        <p class="subzone-modal__type">{{ typeLabel }}</p>
        <p class="subzone-modal__narrative">{{ subZone.narrative }}</p>

        <template v-if="isNarrativeContent(subZone.content)">
          <p class="subzone-modal__speaker">{{ subZone.content.speaker }}</p>
          <p
            v-for="(line, i) in subZone.content.lines"
            :key="i"
            class="subzone-modal__line"
          >
            {{ line }}
          </p>
        </template>

        <DialoguePanel
          v-else-if="isDialogueContent(subZone.content)"
          :content="subZone.content"
          :sub-zone-id="subZone.id"
          :at-place="atThisPlace"
        />

        <template v-else-if="isDungeonContent(subZone.content)">
          <p class="subzone-modal__line subzone-modal__line--emphasis">
            {{ subZone.content.name }}
          </p>
          <p class="subzone-modal__line">{{ subZone.content.teaser }}</p>
        </template>

        <template v-else-if="isMerchantContent(subZone.content)">
          <p class="subzone-modal__speaker">{{ subZone.content.shopName }}</p>
          <p class="subzone-modal__quote">{{ subZone.content.greeting }}</p>
        </template>

        <template v-else-if="isExitContent(subZone.content)">
          <p class="subzone-modal__line">
            Destination : <strong>{{ subZone.content.targetZoneName }}</strong>
          </p>
        </template>

        <template v-else-if="isCombatContent(subZone.content)">
          <p class="subzone-modal__line subzone-modal__line--emphasis">
            {{ combatTitle }}
          </p>
        </template>
      </section>

      <section v-if="showActionSection" class="subzone-modal__action">
        <span class="subzone-modal__action-label">Action</span>

        <template v-if="isCombatContent(subZone.content) && combatContent">
          <RollResult
            v-if="rollState.vigilance"
            :roll="rollState.vigilance"
          />

          <template v-if="showRematchCheck">
            <p class="subzone-modal__hint">
              Cette zone est pacifiée. Jetez un œil aux alentours avant de
              repartir.
            </p>
            <DiceRollButton
              :label="`Vigilance (1d20, seuil ${combatContent.rematchThreshold ?? 4})`"
              :sides="20"
              variant="check"
              :settled-value="rollState.vigilance?.value ?? null"
              @rolled="onRematchCheckRolled"
            />
          </template>

          <template v-if="showCombatButton && !isCombatOpen">
            <p
              v-if="rollState.rematchTriggered"
              class="subzone-modal__hint subzone-modal__hint--danger"
            >
              La menace est de retour ! Engagez le combat pour débloquer les
              chemins.
            </p>
            <p v-else class="subzone-modal__hint">
              Affrontez l'adversaire au combat de dés (5d6, style Dice Throne).
            </p>
            <button type="button" class="btn-primary btn-combat-start" @click="engageCombat">
              Engager le combat
            </button>
          </template>
        </template>

        <template v-else-if="isExitContent(subZone.content)">
          <button
            v-if="atThisPlace"
            type="button"
            class="btn-primary"
            @click="handleExit"
          >
            Emprunter la sortie
          </button>
          <p v-else class="subzone-modal__muted">
            Rendez-vous sur ce lieu pour partir.
          </p>
          <p v-if="exitMessage" class="subzone-modal__result">{{ exitMessage }}</p>
        </template>

        <template v-else-if="isMerchantContent(subZone.content)">
          <p class="subzone-modal__muted">Boutique — à venir.</p>
        </template>
      </section>

      <section
        v-if="showPaths && travelOptions.length"
        class="subzone-modal__travel"
      >
        <span class="subzone-modal__travel-label">Chemins</span>
        <ul class="travel-options">
          <li v-for="opt in travelOptions" :key="opt.target.id">
            <button
              type="button"
              class="travel-option"
              :data-zone-type="opt.target.type"
              @click="handleTravel(opt.target.id)"
            >
              <template v-if="opt.explored">
                {{ opt.target.name }}
              </template>
              <template v-else>
                {{ opt.travelLabel }}
              </template>
            </button>
          </li>
        </ul>
      </section>

      <section
        v-else-if="!atThisPlace && subZone && canTravelTo(subZone.id)"
        class="subzone-modal__travel"
      >
        <button type="button" class="btn-primary" @click="handleGoHere">
          Se rendre ici
        </button>
      </section>

      <p
        v-else-if="atThisPlace && !showPaths && (isCombatContent(subZone.content) || isDialogueContent(subZone.content))"
        class="subzone-modal__blocked"
      >
        <template v-if="isCombatContent(subZone.content)">
          Les chemins sont bloqués tant que la menace n'est pas résolue.
        </template>
        <template v-else>
          Terminez la conversation pour emprunter les chemins.
        </template>
      </p>
    </div>
  </AppModal>
</template>
