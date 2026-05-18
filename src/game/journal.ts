import { ref } from 'vue'

export const journal = ref<string[]>([])

export function addJournal(lines: string[]): void {
  journal.value = [...journal.value, ...lines]
}

export function clearJournal(): void {
  journal.value = []
}
