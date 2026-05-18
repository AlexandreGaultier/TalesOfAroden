<script setup lang="ts">
import { computed } from 'vue'
import {
  currentZone,
  isAtLocation,
  mapSubZones,
  openSubZoneModal,
} from '../../game/gameSession'
import SubZoneCard from './SubZoneCard.vue'

const gridCols = computed(() => {
  const zones = mapSubZones.value
  if (!zones.length) return 5
  return Math.max(...zones.map((z) => z.mapPosition.col)) + 1
})

const gridRows = computed(() => {
  const zones = mapSubZones.value
  if (!zones.length) return 4
  return Math.max(...zones.map((z) => z.mapPosition.row)) + 1
})

const mapStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridCols.value}, minmax(160px, 1fr))`,
  gridTemplateRows: `repeat(${gridRows.value}, minmax(130px, auto))`,
}))
</script>

<template>
  <section class="zone-map">
    <header v-if="currentZone" class="zone-map__header">
      <h1>{{ currentZone.name }}</h1>
      <p>{{ currentZone.description }}</p>
    </header>

    <div class="zone-map__grid" :style="mapStyle">
      <SubZoneCard
        v-for="sz in mapSubZones"
        :key="sz.id"
        :sub-zone="sz"
        :active="isAtLocation(sz.id)"
        @open="openSubZoneModal"
      />
    </div>

    <p v-if="mapSubZones.length === 1" class="zone-map__hint">
      Cliquez sur un lieu pour l'explorer et trouver les chemins.
    </p>
  </section>
</template>
