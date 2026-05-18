import { ref } from 'vue'

export const journal = ref<string[]>([])

export function addJournal(lines: string[]): void {
  journal.value = [...journal.value, ...lines]
}

export function clearJournal(): void {
  journal.value = []
}

export function getJournalSnapshot(): string[] {
  return [...journal.value]
}

export function loadJournal(lines: string[]): void {
  journal.value = [...lines]
}
