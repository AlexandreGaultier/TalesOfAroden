import foretSylvestre from '../data/zones/foret-sylvestre.json'
import montagnesAroden from '../data/zones/montagnes-aroden.json'
import type { GameZone, SubZone, ZoneConnection } from '../types/game'

const zones: Record<string, GameZone> = {
  [foretSylvestre.id]: foretSylvestre as GameZone,
  [montagnesAroden.id]: montagnesAroden as GameZone,
}

export function getZone(zoneId: string): GameZone | undefined {
  return zones[zoneId]
}

export function getSubZone(zoneId: string, subZoneId: string): SubZone | undefined {
  const zone = getZone(zoneId)
  return zone?.subZones.find((sz) => sz.id === subZoneId)
}

export function getConnection(
  zoneId: string,
  fromSubZoneId: string,
  targetSubZoneId: string,
): ZoneConnection | undefined {
  const subZone = getSubZone(zoneId, fromSubZoneId)
  return subZone?.connections.find((c) => c.targetId === targetSubZoneId)
}

/** Voisins bidirectionnels (connexions explicites + liens inverses). */
export function getNeighbors(zoneId: string, subZoneId: string): SubZone[] {
  const zone = getZone(zoneId)
  if (!zone) return []

  const neighborIds = new Set<string>()

  const current = getSubZone(zoneId, subZoneId)
  current?.connections.forEach((c) => neighborIds.add(c.targetId))

  zone.subZones.forEach((other) => {
    if (other.id === subZoneId) return
    if (other.connections.some((c) => c.targetId === subZoneId)) {
      neighborIds.add(other.id)
    }
  })

  return [...neighborIds]
    .map((id) => getSubZone(zoneId, id))
    .filter((sz): sz is SubZone => sz !== undefined)
}

export function areNeighbors(
  zoneId: string,
  fromId: string,
  toId: string,
): boolean {
  if (fromId === toId) return true
  return getNeighbors(zoneId, fromId).some((sz) => sz.id === toId)
}

export function listZoneIds(): string[] {
  return Object.keys(zones)
}
