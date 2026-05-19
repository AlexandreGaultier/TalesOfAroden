<script setup lang="ts">
defineProps<{
  title: string
  wide?: boolean
  extraWide?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div
      class="modal-panel"
      :class="{
        'modal-panel--wide': wide && !extraWide,
        'modal-panel--extra-wide': extraWide,
      }"
      role="dialog"
      aria-modal="true"
    >
      <header class="modal-panel__header">
        <h2>{{ title }}</h2>
        <button
          type="button"
          class="modal-panel__close"
          aria-label="Fermer"
          @click="emit('close')"
        >
          ×
        </button>
      </header>
      <div class="modal-panel__body">
        <slot />
      </div>
    </div>
  </div>
</template>
