/**
 * Fixed provenance + disclaimer block rendered at the bottom of every
 * MedLifeSim outcome report. Kept in a single constant so the wording
 * stays consistent across surfaces (report page, exports, future email
 * summaries) and so it has a single seam to localize.
 */
export const MEDLIFESIM_DISCLAIMER = {
  title: 'AI Simulation Assessment', 
  body: 'This report models possible health outcomes based on input conditions and intervention choices. It is intended for educational exploration and should not be used as medical advice or diagnosis.',
} as const
