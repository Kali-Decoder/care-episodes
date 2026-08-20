/**
 * Example prompts surfaced in the PromptToScenarioModal (F.15).
 * The user can click any of these to open the modal pre-filled
 * with the corresponding prompt text.
 *
 * Each prompt is hand-tuned to ask the model for ~3-5 cards across
 * all three columns (subject / exposure / intervention) with realistic
 * evidence-based values. The model's output is unpredictable for very
 * long prompts; these stay short enough to be a single coherent
 * scenario.
 *
 * Split: 3 community + 2 hospital.
 */
export const SCENARIO_PRESETS = [
  {
    id: 'kids-night-cough',
    label: 'Kids · Night Cough',
    prompt:
      'Three children, ages 4, 5, and 6. Two of them have had a persistent nighttime cough for 2 days. The third child is fine. Their parents are exploring interventions: humidifier in the bedroom, over-the-counter cough medicine, allergen reduction (dust mites, pets), and visiting a pediatrician for underlying asthma evaluation. Make 2-3 subject cards, 1 exposure card, and 3-4 intervention cards.',
  },
  {
    id: 'school-flu-india',
    label: 'School · Flu',
    prompt:
      'A primary school in Mumbai has 8 confirmed flu cases in one week out of 200 students. The school is weighing interventions: hand sanitizer stations, mask mandate, day-of-symptom exclusion, and a vaccination drive for at-risk students. Make 2-3 subject cards, 1 exposure card, and 3-4 intervention cards.',
  },
  {
    id: 'senior-center-brazil',
    label: 'Senior · Outbreak',
    prompt:
      'A senior day-care center in São Paulo has 3 residents with norovirus symptoms (vomiting, diarrhea) over 48 hours. Staff are weighing: full center deep clean, visitor restrictions, individual room quarantine, and communal meal suspension. Make 2-3 subject cards, 1 exposure card, and 3-4 intervention cards.',
  },
  {
    id: 'er-chest-pain-uk',
    label: 'Hospital · ER Chest Pain',
    prompt:
      'The emergency room at a London hospital sees 6 chest pain patients in 4 hours on a hot afternoon. Staff are triaging: standard ECG protocol, troponin testing, CT angiography, observation admission vs. discharge with cardiology follow-up. Make 2-3 subject cards, 1 exposure card, and 3-4 intervention cards.',
  },
  {
    id: 'nicu-cluster-japan',
    label: 'Hospital · NICU Cluster',
    prompt:
      'The NICU at a Tokyo hospital has 2 premature babies develop MRSA in 5 days. Infection control is weighing: full unit screening, contact precautions, visitor restriction, and antibiotic protocol review. Make 2-3 subject cards, 1 exposure card, and 3-4 intervention cards.',
  },
] as const

export type ScenarioPresetId = (typeof SCENARIO_PRESETS)[number]['id']
export type ScenarioPreset = (typeof SCENARIO_PRESETS)[number]