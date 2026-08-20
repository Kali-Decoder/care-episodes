import { randomTone, toPlacedCard } from './simulationCards'
import { PALETTE_CARDS } from './simulationCards'
import type { CanvasCard, Connection, SimTemplate } from '../types/simulation'

/**
 * Pre-built full-canvas scenarios. Each template ships with pre-connected
 * cards laid out across a 3-column grid (x = 220 / 540 / 860,
 * y = 220 plus a small vertical offset per row). Templates are loaded
 * from the toolbar's "New Scenario ▾" dropdown.
 *
 * The 3-step pipeline is `subject → exposure → intervention`. The 4
 * environment cards from the old 5-column grid have been recategorized
 * to `exposure` and now sit in the same column as the original
 * exposure cards.
 *
 * Connection ids follow the convention `conn-<from>-<to>` for stability.
 */

function lookupTemplate(id: string) {
  const t = PALETTE_CARDS.find((c) => c.id === id)
  if (!t) throw new Error(`Unknown template card id: ${id}`)
  return t
}

function cardAt(templateId: string, placementSuffix: string, x: number, y: number): CanvasCard {
  const t = lookupTemplate(templateId)
  const placementId = `${templateId}-${placementSuffix}`
  return {
    ...toPlacedCard(t, placementId),
    x,
    y,
    collapsed: false,
  }
}

function conn(id: string, from: string, to: string): Connection {
  return { id, from, to }
}

const X_SUBJ = 220
const X_EXPO = 540
const X_INTV = 860
const Y = 220

// ─── Template 1: High-Rise Office · Secondhand Smoke ──────────────────
// 2 subjects × 1 exposure × 2 interventions = 4 paths
const officeSmokeCards: CanvasCard[] = [
  cardAt('subj-non-smokers', '0', X_SUBJ, Y - 60),
  cardAt('subj-smokers', '0', X_SUBJ, Y + 60),
  cardAt('exp-indoor-smoking', '0', X_EXPO, Y),
  cardAt('int-no-intervention', '0', X_INTV, Y - 60),
  cardAt('int-no-smoking-policy', '0', X_INTV, Y + 60),
]
const officeSmokeConnections: Connection[] = [
  // each subject → exposure
  conn('conn-non-smoke', officeSmokeCards[0].placementId, officeSmokeCards[2].placementId),
  conn('conn-smk-smoke', officeSmokeCards[1].placementId, officeSmokeCards[2].placementId),
  // exposure → each intervention
  conn('conn-smoke-noint', officeSmokeCards[2].placementId, officeSmokeCards[3].placementId),
  conn('conn-smoke-policy', officeSmokeCards[2].placementId, officeSmokeCards[4].placementId),
]

// ─── Template 2: Community · Teen Drug Addiction ──────────────────────
// 1 subject × 1 exposure × 2 interventions = 2 paths
const teenDrugsCards: CanvasCard[] = [
  cardAt('subj-teens', '0', X_SUBJ, Y),
  cardAt('exp-drug-social', '0', X_EXPO, Y),
  cardAt('int-no-intervention', '0', X_INTV, Y - 60),
  cardAt('int-education-counseling', '0', X_INTV, Y + 60),
]
const teenDrugsConnections: Connection[] = [
  conn('conn-teen-drugs', teenDrugsCards[0].placementId, teenDrugsCards[1].placementId),
  conn('conn-drugs-noint', teenDrugsCards[1].placementId, teenDrugsCards[2].placementId),
  conn('conn-drugs-edu', teenDrugsCards[1].placementId, teenDrugsCards[3].placementId),
]

// ─── Template 4: School · Infectious Outbreak ──────────────────────────
// 1 subject × 1 exposure × 2 interventions = 2 paths
const schoolOutbreakCards: CanvasCard[] = [
  cardAt('subj-school-children', '0', X_SUBJ, Y),
  cardAt('exp-respiratory-outbreak', '0', X_EXPO, Y),
  cardAt('int-no-intervention', '0', X_INTV, Y - 60),
  cardAt('int-vaccination', '0', X_INTV, Y + 60),
]
const schoolOutbreakConnections: Connection[] = [
  conn('conn-children-outbreak', schoolOutbreakCards[0].placementId, schoolOutbreakCards[1].placementId),
  conn('conn-outbreak-noint', schoolOutbreakCards[1].placementId, schoolOutbreakCards[2].placementId),
  conn('conn-outbreak-vaccine', schoolOutbreakCards[1].placementId, schoolOutbreakCards[3].placementId),
]

// ─── Template 5: Urban · Metabolic Decline ───────────────────────────
// 1 subject × 2 exposures × 2 interventions = 4 paths
const urbanMetabolicCards: CanvasCard[] = [
  cardAt('subj-non-smokers', '0', X_SUBJ, Y),
  cardAt('exp-sedentary-work', '0', X_EXPO, Y - 60),
  cardAt('exp-pm25-outdoor', '0', X_EXPO, Y + 60),
  cardAt('int-no-intervention', '0', X_INTV, Y - 60),
  cardAt('int-health-screening', '0', X_INTV, Y + 60),
]
const urbanMetabolicConnections: Connection[] = [
  conn('conn-worker-sedentary', urbanMetabolicCards[0].placementId, urbanMetabolicCards[1].placementId),
  conn('conn-worker-pm25', urbanMetabolicCards[0].placementId, urbanMetabolicCards[2].placementId),
  conn('conn-sedentary-noint', urbanMetabolicCards[1].placementId, urbanMetabolicCards[3].placementId),
  conn('conn-sedentary-screening', urbanMetabolicCards[1].placementId, urbanMetabolicCards[4].placementId),
  conn('conn-pm25-noint', urbanMetabolicCards[2].placementId, urbanMetabolicCards[3].placementId),
  conn('conn-pm25-screening', urbanMetabolicCards[2].placementId, urbanMetabolicCards[4].placementId),
]

// ─── Template 7: Hospital · Emergency Transfusion ─────────────────────
// 2 subjects × 1 exposure × 4 interventions = 8 paths
const emergencyTransfusionCards: CanvasCard[] = [
  cardAt('subj-emergency-patients', '0', X_SUBJ, Y - 60),
  cardAt('subj-trauma-bleeding', '0', X_SUBJ, Y + 60),
  cardAt('exp-incompatible-transfusion', '0', X_EXPO, Y),
  cardAt('int-no-rescue', '0', X_INTV, Y - 90),
  cardAt('int-fluid-resuscitation', '0', X_INTV, Y - 30),
  cardAt('int-exchange-transfusion', '0', X_INTV, Y + 30),
  cardAt('int-organ-support', '0', X_INTV, Y + 90),
]
const emergencyTransfusionConnections: Connection[] = [
  // each subject → exposure
  conn('conn-emergency-mismatch', emergencyTransfusionCards[0].placementId, emergencyTransfusionCards[2].placementId),
  conn('conn-trauma-mismatch', emergencyTransfusionCards[1].placementId, emergencyTransfusionCards[2].placementId),
  // exposure → each intervention
  conn('conn-mismatch-norescue', emergencyTransfusionCards[2].placementId, emergencyTransfusionCards[3].placementId),
  conn('conn-mismatch-fluid', emergencyTransfusionCards[2].placementId, emergencyTransfusionCards[4].placementId),
  conn('conn-mismatch-exchange', emergencyTransfusionCards[2].placementId, emergencyTransfusionCards[5].placementId),
  conn('conn-mismatch-organ', emergencyTransfusionCards[2].placementId, emergencyTransfusionCards[6].placementId),
]

// Touch randomTone so the import isn't dead-code-eliminated (the helper is
// invoked through toPlacedCard).
void randomTone

export const SIM_TEMPLATES: SimTemplate[] = [
  {
    id: 'office-smoke',
    name: 'Office · Secondhand Smoke',
    description:
      'High-rise office with mixed smoker / non-smoker staff and indoor exposure.',
    canvas: { cards: officeSmokeCards, connections: officeSmokeConnections },
  }, 
  {
    id: 'emergency-transfusion',
    name: 'Hospital · Emergency Transfusion',
    description:
      'Post-adverse-event rescue simulation for incompatible blood transfusion scenarios.',
    canvas: { cards: emergencyTransfusionCards, connections: emergencyTransfusionConnections },
  },
  {
    id: 'teen-drugs',
    name: 'Community · Teen Drug Addiction',
    description:
      'Semi-urban community with at-risk teens exposed to peer drug access.',
    canvas: { cards: teenDrugsCards, connections: teenDrugsConnections },
  },
  {
    id: 'school-outbreak',
    name: 'School · Infectious Outbreak',
    description:
      'School children facing respiratory outbreak waves and poor ventilation.',
    canvas: { cards: schoolOutbreakCards, connections: schoolOutbreakConnections },
  },
  {
    id: 'urban-metabolic',
    name: 'Urban · Metabolic Decline',
    description:
      'Office workers with sedentary lifestyle and outdoor air pollution exposure.',
    canvas: { cards: urbanMetabolicCards, connections: urbanMetabolicConnections },
  },
]
