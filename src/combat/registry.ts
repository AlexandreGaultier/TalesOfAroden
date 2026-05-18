import type { CombatantDef } from '../types/combat'
import voyageur from '../data/combat/heroes/voyageur.json'
import ombres from '../data/combat/enemies/foret-sylvestre/ombres-clairiere.json'
import meute from '../data/combat/enemies/foret-sylvestre/meute-alpha.json'
import sanglier from '../data/combat/enemies/foret-sylvestre/sanglier-roncecoeur.json'

const heroes: Record<string, CombatantDef> = {
  [voyageur.id]: voyageur as unknown as CombatantDef,
}

const enemies: Record<string, CombatantDef> = {
  [ombres.id]: ombres as unknown as CombatantDef,
  [meute.id]: meute as unknown as CombatantDef,
  [sanglier.id]: sanglier as unknown as CombatantDef,
}

export function getHero(id: string): CombatantDef | undefined {
  return heroes[id]
}

export function getEnemy(id: string): CombatantDef | undefined {
  return enemies[id]
}
