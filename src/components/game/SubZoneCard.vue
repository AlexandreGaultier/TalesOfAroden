<script setup lang="ts">
import { computed } from 'vue'
import type { SubZone } from '../../types/game'
import { ZONE_TYPE_LABELS } from '../../game/zoneTypes'

const props = defineProps<{
  subZone: SubZone
  active?: boolean
}>()

const emit = defineEmits<{
  open: [subZoneId: string]
}>()

const typeLabel = computed(() => ZONE_TYPE_LABELS[props.subZone.type])

const gridStyle = computed(() => ({
  gridColumn: props.subZone.mapPosition.col,
  gridRow: props.subZone.mapPosition.row,
}))
</script>

<template>
  <button
    type="button"
    class="subzone-card"
    :class="{ 'subzone-card--active': active }"
    :data-zone-type="subZone.type"
    :style="gridStyle"
    @click="emit('open', subZone.id)"
  >
    <span class="subzone-card__type">{{ typeLabel }}</span>
    <h3 class="subzone-card__title">{{ subZone.name }}</h3>
    <p class="subzone-card__narrative">{{ subZone.narrative }}</p>
  </button>
</template>
