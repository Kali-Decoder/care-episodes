export const CARE_HOME = '/dashboard'
export const CARE_EPISODE = (episodeId: string) =>
  `/dashboard/episode?id=${encodeURIComponent(episodeId)}`
