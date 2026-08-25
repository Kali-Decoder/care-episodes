export const CARE_HOME = '/dashboard'
export const CARE_EPISODES = '/dashboard/episodes'
export const CARE_EPISODE = (episodeId: string) =>
  `/dashboard/episode?id=${encodeURIComponent(episodeId)}`
