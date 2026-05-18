import { ref, computed } from 'vue'
import type {
  CombatAbility,
  CombatLogEntry,
  CombatLogKind,
  CombatSession,
} from '../types/combat'
import type { CombatContent } from '../types/game'
import {
  INITIATIVE_DURATION_MS,
  applyDamage,
  createFighter,
  getMatchingForSide,
  rerollSelectedDice,
  resolveFirstAttacker,
  rollInitiativeD20,
  runEnemyTurn,
  startPlayerRoll,
} from './engine'
import { getEnemy, getHero } from './registry'
import { addFlag, getPlayer, setHp } from '../game/playerStore'
import { addJournal } from '../game/journal'
import { setCombatVisitSafe } from '../game/combatState'
import { formatDiceAsSymbols } from './symbols'

const ENEMY_TURN_DELAY_MS = 1200

export const session = ref<CombatSession | null>(null)
export const heroDef = ref<ReturnType<typeof getHero>>(undefined)
export const enemyDef = ref<ReturnType<typeof getEnemy>>(undefined)

export const isCombatOpen = computed(() => session.value !== null)

export const matchingAbilities = computed((): CombatAbility[] => {
  const s = session.value
  const hero = heroDef.value
  if (!s || !hero || s.phase !== 'player_ability') return []
  return getMatchingForSide(s, hero.abilities)
})

export const enemyMatchingAbilities = computed((): CombatAbility[] => {
  const s = session.value
  const enemy = enemyDef.value
  if (!s || !enemy || s.phase !== 'enemy_turn' || !s.dice.length) return []
  return getMatchingForSide(s, enemy.abilities)
})

function log(kind: CombatLogKind, message: string): CombatLogEntry {
  return { kind, message }
}

function pushLog(...entries: CombatLogEntry[]): void {
  const s = session.value
  if (!s) return
  session.value = { ...s, log: [...s.log, ...entries] }
}

export function startCombat(
  heroId: string,
  enemyId: string,
  context: CombatSession['context'],
): boolean {
  const hero = getHero(heroId)
  const enemy = getEnemy(enemyId)
  if (!hero || !enemy) return false

  heroDef.value = hero
  enemyDef.value = enemy

  const player = getPlayer()
  const init = rollInitiativeD20()
  const first = resolveFirstAttacker(init)

  session.value = {
    context,
    phase: 'initiative',
    hero: createFighter(hero, player.hp),
    enemy: createFighter(enemy),
    dice: [],
    toReroll: [],
    rerollsLeft: 0,
    initiative: init,
    activeSide: first,
    log: [
      log('system', `Initiative — Vous : ${init.hero} | ${enemy.name} : ${init.enemy}`),
      log(
        'system',
        first === 'hero'
          ? 'Vous attaquez en premier.'
          : `${enemy.name} attaque en premier.`,
      ),
    ],
    winner: null,
    initiativeShownAt: Date.now(),
    lastEnemyAbilityId: null,
  }

  setTimeout(() => {
    if (!session.value || session.value.phase !== 'initiative') return
    beginTurn(session.value.activeSide)
  }, INITIATIVE_DURATION_MS)

  return true
}

function beginTurn(side: 'hero' | 'enemy'): void {
  const s = session.value
  if (!s) return

  if (side === 'hero') {
    const roll = startPlayerRoll()
    session.value = {
      ...s,
      phase: 'player_roll',
      activeSide: 'hero',
      ...roll,
      log: [
        ...s.log,
        log('turn-hero', '— Votre tour : lancez et relancez vos dés (5d6).'),
      ],
    }
    return
  }

  session.value = {
    ...s,
    phase: 'enemy_turn',
    activeSide: 'enemy',
    dice: [],
    log: [...s.log, log('turn-enemy', `— Tour de ${s.enemy.name} —`)],
  }
  setTimeout(() => runEnemyTurnAction(), ENEMY_TURN_DELAY_MS)
}

export function toggleDieToReroll(index: number): void {
  const s = session.value
  if (!s || s.phase !== 'player_roll') return
  const toReroll = [...s.toReroll]
  toReroll[index] = !toReroll[index]
  session.value = { ...s, toReroll }
}

export function playerReroll(): void {
  const s = session.value
  if (!s || s.phase !== 'player_roll' || s.rerollsLeft <= 0) return
  if (!s.toReroll.some(Boolean)) return
  const dice = rerollSelectedDice(s)
  session.value = {
    ...s,
    dice,
    toReroll: Array(s.toReroll.length).fill(false),
    rerollsLeft: s.rerollsLeft - 1,
    log: [
      ...s.log,
      log(
        'dice',
        `Relance — ${formatDiceAsSymbols(dice)} (${s.rerollsLeft - 1} relance(s) restante(s))`,
      ),
    ],
  }
}

export function confirmPlayerRoll(): void {
  const s = session.value
  if (!s || s.phase !== 'player_roll') return
  session.value = {
    ...s,
    phase: 'player_ability',
    log: [
      ...s.log,
      log('dice', `Dés validés : ${formatDiceAsSymbols(s.dice)}`),
      log('system', 'Choisissez une capacité ou passez votre tour.'),
    ],
  }
}

export function playerUseAbility(abilityId: string): void {
  const s = session.value
  const hero = heroDef.value
  const enemy = enemyDef.value
  if (!s || !hero || !enemy || s.phase !== 'player_ability') return

  const ability = hero.abilities.find((a) => a.id === abilityId)
  if (!ability) return

  resolvePlayerAbility(ability)
}

export function playerPassTurn(): void {
  const s = session.value
  if (!s || s.phase !== 'player_ability') return
  pushLog(log('action-hero', 'Aucune combinaison valide — vous passez votre tour.'))
  endPlayerTurn()
}

function resolvePlayerAbility(ability: CombatAbility): void {
  const s = session.value
  const enemy = enemyDef.value
  if (!s || !enemy) return

  const matches = getMatchingForSide(s, heroDef.value!.abilities)
  if (!matches.some((a) => a.id === ability.id)) return

  const newEnemy = applyDamage(s.enemy, ability.damage)
  pushLog(
    log('action-hero', `⚔ ${ability.name}`),
    log('damage', `${ability.damage} dégâts infligés à ${enemy.name}.`),
  )

  session.value = { ...s, enemy: newEnemy }

  if (newEnemy.hp <= 0) {
    endCombat('hero')
    return
  }
  endPlayerTurn()
}

function endPlayerTurn(): void {
  beginTurn('enemy')
}

function runEnemyTurnAction(): void {
  const s = session.value
  const enemy = enemyDef.value
  const hero = heroDef.value
  if (!s || !enemy || !hero) return

  const { dice, ability } = runEnemyTurn(enemy)

  session.value = {
    ...s,
    dice,
    lastEnemyAbilityId: ability?.id ?? null,
    log: [
      ...s.log,
      log('dice', `${enemy.name} lance : ${formatDiceAsSymbols(dice)}`),
    ],
  }

  if (!ability) {
    pushLog(log('action-enemy', `${enemy.name} ne forme aucune combinaison et passe.`))
    setTimeout(() => beginTurn('hero'), 600)
    return
  }

  const newHero = applyDamage(s.hero, ability.damage)
  pushLog(
    log('action-enemy', `⚔ ${enemy.name} : ${ability.name}`),
    log('damage', `${ability.damage} dégâts reçus.`),
  )

  session.value = {
    ...session.value!,
    hero: newHero,
    lastEnemyAbilityId: ability.id,
  }

  setHp(newHero.hp)

  if (newHero.hp <= 0) {
    endCombat('enemy')
    return
  }
  setTimeout(() => beginTurn('hero'), 800)
}

function endCombat(winner: 'hero' | 'enemy'): void {
  const s = session.value
  if (!s) return

  if (winner === 'hero') {
    addFlag(s.context.victoryFlag)
    setCombatVisitSafe(s.context.subZoneId, true)
    addJournal([`Victoire contre ${s.enemy.name} !`])
    pushLog(log('result', 'Victoire !'))
  } else {
    setHp(0)
    addJournal([`Défaite face à ${s.enemy.name}…`])
    pushLog(log('result', 'Défaite…'))
  }

  session.value = {
    ...s,
    phase: 'ended',
    winner,
    hero: winner === 'enemy' ? { ...s.hero, hp: 0 } : s.hero,
    enemy: winner === 'hero' ? { ...s.enemy, hp: 0 } : s.enemy,
  }
}

export function closeCombat(): void {
  const s = session.value
  if (s && s.winner === 'hero') {
    setHp(session.value!.hero.hp)
  }
  session.value = null
  heroDef.value = undefined
  enemyDef.value = undefined
}

export function startCombatFromZone(
  content: CombatContent,
  zoneId: string,
  subZoneId: string,
  isRematch: boolean,
): boolean {
  return startCombat('voyageur', content.enemyId, {
    subZoneId,
    zoneId,
    victoryFlag: content.victoryFlag,
    isRematch,
    introTitle: isRematch ? content.rematchTitle : content.title,
  })
}
