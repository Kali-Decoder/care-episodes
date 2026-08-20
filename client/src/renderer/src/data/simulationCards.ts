import type {
  PlacedCard,
  SimCardTemplate,
  SimCategory,
  SimTone,
} from '../types/simulation'

/**
 * Pure placeholder data for the simulation builder.
 * Realistic scenarios for Thailand-focused pilots.
 *
 * Outcome computation lives in `simulationPaths.ts` and `simulationTemplates.ts`.
 * This file is intentionally limited to: card catalog, tone utilities, and
 * connection-rule helpers.
 */

export const CATEGORY_ORDER: SimCategory[] = [
  'subject',
  'exposure',
  'intervention',
]

export const CATEGORY_LABELS: Record<SimCategory, string> = {
  subject: 'Subject',
  exposure: 'Exposure',
  intervention: 'Intervention',
}

export const CATEGORY_PREFIX: Record<SimCategory, string> = {
  subject: 'SUBJ',
  exposure: 'EXPO',
  intervention: 'INT',
}

export const PALETTE_CARDS: SimCardTemplate[] = [
  // ── Exposure (context: where risk originates) ─────────────────────────
  {
    id: 'env-urban-school-bkk',
    category: 'exposure',
    title: 'Urban School', 
    exposureFields: {
      dose: '35',
      unit: 'PM2.5 µg/m³ (avg)',
      duration: '6h school day',
      frequency: 'daily',
      setting: 'outdoor recess + unfiltered classrooms',
      context: 'Bangkok roadside primary; peak-hour traffic exposure',
    },
  },
  {
    id: 'env-office-highrise',
    category: 'exposure',
    title: 'High-rise Office', 
    exposureFields: {
      dose: '~30',
      unit: 'm³ per person recirculated',
      duration: '8h',
      frequency: 'daily weekday',
      setting: 'indoor shared office, recirculated AC',
      context: 'Open-plan bullpen with shared ventilation',
    },
  },
  {
    id: 'env-family-home',
    category: 'exposure',
    title: 'Multi-gen Family Home', 
    exposureFields: {
      dose: 'variable',
      unit: '—',
      duration: 'continuous',
      frequency: 'daily',
      setting: 'multi-generational suburban home',
      context: 'Bangkok suburb; elderly + working-age cohabitants',
    },
  },

  // ── Subject ───────────────────────────────────────────────────────────
  {
    id: 'subj-school-children',
    category: 'subject',
    title: 'School Children', 
    subjectFields: {
      ageRange: '7-12',
      sampleSize: 'n=30',
      region: 'Bangkok metropolitan',
      comorbidities: [],
      context: 'Healthy primary school cohort; baseline low risk',
    },
  },
  {
    id: 'subj-non-smokers',
    category: 'subject',
    title: 'Non-Smokers', 
    subjectFields: {
      ageRange: '25-45',
      sampleSize: 'n=15',
      region: 'Bangkok CBD',
      comorbidities: ['mild asthma (2/15)'],
      context: 'No personal tobacco use; passive exposure only',
    },
  },
  {
    id: 'subj-smokers',
    category: 'subject',
    title: 'Smokers', 
    subjectFields: {
      ageRange: '25-45',
      sampleSize: 'n=5',
      region: 'Bangkok CBD',
      comorbidities: [],
      context: 'Active smokers; ~10 cigarettes/day baseline',
    },
  },
  {
    id: 'subj-elderly',
    category: 'subject',
    title: 'Elderly Parents', 
    subjectFields: {
      ageRange: '70+',
      sampleSize: '—',
      region: 'Bangkok suburb',
      comorbidities: ['hypertension', 'type 2 diabetes', 'mild COPD'],
      context: 'Living with adult children; high baseline vulnerability',
    },
  },
  {
    id: 'subj-caregivers',
    category: 'subject',
    title: 'Family Caregivers',  
    subjectFields: {
      ageRange: '35-55',
      sampleSize: '—',
      region: 'Bangkok suburb',
      comorbidities: [],
      context: 'Working full-time while providing daily eldercare',
    },
  },
  {
    id: 'subj-teens',
    category: 'subject',
    title: 'At-risk Teens', 
    subjectFields: {
      ageRange: '13-19',
      sampleSize: '—',
      region: 'Northeast Thailand',
      comorbidities: [],
      context: 'School-attending; peer-network risk factors',
    },
  },
  {
    id: 'subj-low-income-workers',
    category: 'subject',
    title: 'Urban Labor Workers', 
    subjectFields: {
      ageRange: '20-60',
      sampleSize: 'varied',
      region: 'Bangkok informal districts',
      comorbidities: ['undiagnosed hypertension'],
      context: 'Daily physical labor, low healthcare access',
    },
  },
  {
    id: 'subj-pregnant',
    category: 'subject',
    title: 'Pregnant Individuals', 
    subjectFields: {
      ageRange: '18-40',
      sampleSize: '—',
      region: 'urban + suburban',
      comorbidities: [],
      context: 'Increased vulnerability to pollution, infection, stress',
    },
  },
  {
    id: 'subj-emergency-patients',
    category: 'subject',
    title: 'Emergency Patients', 
    subjectFields: {
      ageRange: 'varied',
      sampleSize: 'n=multiple',
      region: 'hospital ER',
      comorbidities: [],
      context: 'Incoming trauma + emergency admissions requiring transfusion',
    },
  },
  {
    id: 'subj-trauma-bleeding',
    category: 'subject',
    title: 'Trauma Patients', 
    subjectFields: {
      ageRange: '18-65',
      sampleSize: '—',
      region: 'ER / ICU',
      comorbidities: [],
      context: 'Acute hemorrhage requiring immediate transfusion support',
    },
  },

  // ── Exposure ──────────────────────────────────────────────────────────
  {
    id: 'exp-pm25-outdoor',
    category: 'exposure',
    title: 'PM2.5 Outdoor', 
    exposureFields: {
      dose: '50-120',
      unit: 'PM2.5 µg/m³',
      duration: '2h recess + sport',
      frequency: 'daily',
      setting: 'outdoor school grounds',
      context: 'Bangkok burning season exposure pattern',
    },
  },
  {
    id: 'exp-indoor-smoking',
    category: 'exposure',
    title: 'Indoor Secondhand Smoke', 
    exposureFields: {
      dose: '5 colleagues',
      unit: 'cigarettes/day equivalent',
      duration: '8h',
      frequency: 'daily weekday',
      setting: 'indoor shared office',
      context: 'Unventilated shared airspace with active smokers',
    },
  },
  {
    id: 'exp-caregiving-load',
    category: 'exposure',
    title: 'Daily Caregiving', 
    exposureFields: {
      dose: '3-5h/day',
      unit: 'hands-on care',
      duration: 'continuous',
      frequency: 'daily',
      setting: 'family home',
      context: 'Medication, bathing, mobility assistance, emotional support',
    },
  },
  {
    id: 'exp-drug-social',
    category: 'exposure',
    title: 'Peer Drug Access', 
    exposureFields: {
      dose: 'social',
      unit: '—',
      duration: 'after-school + weekends',
      frequency: 'weekly',
      setting: 'community gathering spots',
      context: 'Easy peer access; no current use',
    },
  },
  {
    id: 'exp-respiratory-outbreak',
    category: 'exposure',
    title: 'Respiratory Outbreak', 
    exposureFields: {
      dose: 'high contact rate',
      unit: 'contacts/day',
      duration: '2–5 days peak',
      frequency: 'wave-based',
      setting: 'school + household spread',
      context: 'Influenza / COVID-like transmission in dense settings',
    },
  },
  {
    id: 'exp-hospital-visit',
    category: 'exposure',
    title: 'Hospital Visits', 
    exposureFields: {
      dose: 'intermittent',
      unit: 'visits/month',
      duration: '1–3h per visit',
      frequency: 'weekly/monthly',
      setting: 'hospital outpatient ward',
      context: 'Exposure to resistant pathogens + stress + waiting time',
    },
  },
  {
    id: 'exp-sedentary-work',
    category: 'exposure',
    title: 'Sedentary Lifestyle', 
    exposureFields: {
      dose: 'low movement',
      unit: 'steps/day',
      duration: '8–12h',
      frequency: 'daily',
      setting: 'office + commute',
      context: 'Low activity, high metabolic risk accumulation',
    },
  },
  {
    id: 'exp-indoor-isolation',
    category: 'exposure',
    title: 'Indoor Isolation', 
    exposureFields: {
      dose: 'low exchange air',
      unit: 'ACH < 1',
      duration: 'continuous',
      frequency: 'daily',
      setting: 'closed apartment',
      context: 'Reduced ventilation → viral + mental health impact',
    },
  },
  {
    id: 'exp-incompatible-transfusion',
    category: 'exposure',
    title: 'Incompatible Blood Transfusion', 
    exposureFields: {
      dose: 'ABO mismatch',
      unit: 'critical error',
      duration: 'immediate',
      frequency: 'event-based',
      setting: 'blood bank → ER transfusion',
      context: 'Hemolytic reaction triggered after wrong blood type transfusion',
    },
  },

  // ── Health State ──────────────────────────────────────────────────────
  // Removed: health-state is now an implicit property of each Subject card
  // column absorbs the previous Environment column to keep a 3-step
  // pipeline: Subject → Exposure → Intervention.
  // ── Intervention ──────────────────────────────────────────────────────
  {
    id: 'int-no-intervention',
    category: 'intervention',
    title: 'Do Nothing', 
    interventionFields: {
      type: 'baseline',
      intensity: '—',
      compliance: '—',
      context: 'No policy or behaviour change',
    },
  },
  {
    id: 'int-air-purifiers-masks',
    category: 'intervention',
    title: 'Purifiers + Masks', 
    interventionFields: {
      type: 'device + policy',
      intensity: 'school-wide',
      compliance: 'moderate',
      context: 'HEPA purifiers in classrooms + N95 on high-AQI days',
    },
  },
  {
    id: 'int-no-smoking-policy',
    category: 'intervention',
    title: 'No-Smoking Policy', 
    interventionFields: {
      type: 'policy',
      intensity: 'workplace-wide',
      compliance: 'high',
      context: 'Indoor smoking ban with designated outdoor area',
    },
  },
  {
    id: 'int-respite-care',
    category: 'intervention',
    title: 'Respite + Support', 
    interventionFields: {
      type: 'service',
      intensity: 'family-level',
      compliance: 'moderate',
      context: '2x weekly day care + weekly in-home aide',
    },
  },
  {
    id: 'int-education-counseling',
    category: 'intervention',
    title: 'Education + Counseling', 
    interventionFields: {
      type: 'education',
      intensity: 'school-wide + community',
      compliance: 'moderate',
      context: 'Curriculum + counsellor office hours + parent workshops',
    },
  },
  {
    id: 'int-vaccination',
    category: 'intervention',
    title: 'Vaccination Program', 
    interventionFields: {
      type: 'biomedical',
      intensity: 'population-wide',
      compliance: 'variable',
      context: 'Seasonal flu / COVID vaccination rollout',
    },
  },
  {
    id: 'int-hybrid-work',
    category: 'intervention',
    title: 'Hybrid Work Policy', 
    interventionFields: {
      type: 'policy',
      intensity: 'partial remote',
      compliance: 'high',
      context: 'Reduce commute + indoor exposure time',
    },
  },
  {
    id: 'int-health-screening',
    category: 'intervention',
    title: 'Health Screening', 
    interventionFields: {
      type: 'medical service',
      intensity: 'annual',
      compliance: 'moderate',
      context: 'BP, lung function, metabolic screening',
    },
  },
  {
    id: 'int-no-rescue',
    category: 'intervention',
    title: 'No Intervention', 
    interventionFields: {
      type: 'none',
      intensity: 'none',
      compliance: 'n/a',
      context: 'Observe natural progression of reaction without treatment',
    },
  },
  {
    id: 'int-fluid-resuscitation',
    category: 'intervention',
    title: 'IV Fluid Resuscitation', 
    interventionFields: {
      type: 'supportive',
      intensity: 'high',
      compliance: 'standard ICU',
      context: 'Maintain blood pressure and organ perfusion',
    },
  },
  {
    id: 'int-exchange-transfusion',
    category: 'intervention',
    title: 'Exchange Transfusion', 
    interventionFields: {
      type: 'specialized procedure',
      intensity: 'high',
      compliance: 'ICU / specialist',
      context: 'Replace patient blood with compatible donor blood',
    },
  },
  {
    id: 'int-organ-support',
    category: 'intervention',
    title: 'Organ Support Therapy', 
    interventionFields: {
      type: 'life support',
      intensity: 'maximum',
      compliance: 'ICU',
      context: 'Support kidney / organ failure due to hemolysis',
    },
  }
]

export const TONE_COLORS: Record<SimTone, string> = {
  blue: '#1A1AE8',
  teal: '#3EC4C0',
  navy: '#0a0a5c',
  muted: '#9999bb',
}

const TONE_VALUES: SimTone[] = ['blue', 'teal', 'navy', 'muted']

export function randomTone(seed: string): SimTone {

  if (seed === "intervention") {
    return "navy"
  }

  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return TONE_VALUES[Math.abs(hash) % TONE_VALUES.length]
}

export const TONE_TINT = (tone: SimTone): string => {
  const c = TONE_COLORS[tone]
  if (tone === 'teal') return 'rgba(62,196,192,0.16)'
  if (tone === 'muted') return 'rgba(153,153,187,0.14)'
  return c.length === 7 ? c + '12' : c
}

/** Connection rules (strict linear pipeline). */
const VALID_CONNECTIONS: Record<SimCategory, SimCategory[]> = {
  subject: ['exposure'],
  exposure: ['intervention'],
  intervention: [],
}

export function canConnect(from: SimCategory, to: SimCategory): boolean {
  return VALID_CONNECTIONS[from]?.includes(to) ?? false
}

export function describeConnectionRule(target: SimCategory): string {
  const allowed = Object.entries(VALID_CONNECTIONS)
    .filter(([, targets]) => targets.includes(target))
    .map(([src]) => CATEGORY_LABELS[src as SimCategory])
  return allowed.length === 0
    ? `${CATEGORY_LABELS[target]} cannot accept connections.`
    : `${CATEGORY_LABELS[target]} can only accept connections from ${allowed.join(' or ')}.`
}

export function toPlacedCard(template: SimCardTemplate, placementId: string): PlacedCard {
  return { ...template, placementId, tone: randomTone(template.category) }
}

export function cardHasInput(category: SimCategory): boolean {
  return category !== 'subject'
}

export function cardHasOutput(category: SimCategory): boolean {
  return category !== 'intervention'
}
