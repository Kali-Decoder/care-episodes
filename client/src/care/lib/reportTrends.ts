import type { Episode, ReportValue, ResultFlag, ResultTrend } from '../types'

export type TrendPoint = {
  date: string
  value: number
  episode_id?: string
  episode_label?: string
}

export type ParameterTrend = {
  test_code: string
  display_name: string
  unit: string
  ref_low: number
  ref_high: number
  latest_value: number
  latest_flag: ResultFlag
  latest_trend: ResultTrend
  points: TrendPoint[]
}

export type EpisodeTrendOption = {
  episode_id: string
  label: string
  report_date: string
  summary_line: string
}

const REPORT_STATES = new Set([
  'REPORT_RECEIVED',
  'TRENDS_ANALYZED',
  'ANOMALY_FOUND',
  'CONSULT_REQUESTED',
  'NORMAL',
  'CLOSED',
])

function dateKey(isoOrDate: string): string {
  return isoOrDate.slice(0, 10)
}

function episodeLabel(ep: Episode): string {
  const upload = ep.timeline.find((t) => t.action === 'uploaded_prescription')?.detail
  return upload ?? ep.summary_line ?? ep.episode_id
}

function indexEpisodesByReportDate(episodes: Episode[]): Map<string, Episode> {
  const map = new Map<string, Episode>()
  for (const ep of episodes) {
    if (ep.report?.received_at) {
      map.set(dateKey(ep.report.received_at), ep)
    }
  }
  return map
}

function resolvePointEpisode(
  date: string,
  fallback: Episode,
  byDate: Map<string, Episode>,
): Pick<TrendPoint, 'episode_id' | 'episode_label'> {
  const matched = byDate.get(dateKey(date))
  const ep = matched ?? fallback
  return {
    episode_id: ep.episode_id,
    episode_label: episodeLabel(ep),
  }
}

function trendsFromEpisode(ep: Episode): ParameterTrend[] {
  const report = ep.report
  if (!report?.values?.length) return []

  const reportDate = dateKey(report.received_at)
  const epMeta = {
    episode_id: ep.episode_id,
    episode_label: episodeLabel(ep),
  }

  return report.values
    .map((meta) => {
      const pointMap = new Map<string, TrendPoint>()

      for (const h of meta.history ?? []) {
        const key = dateKey(h.date)
        pointMap.set(key, {
          date: key,
          value: h.value,
          ...epMeta,
        })
      }

      pointMap.set(reportDate, {
        date: reportDate,
        value: meta.value,
        ...epMeta,
      })

      const series = [...pointMap.values()].sort((a, b) => a.date.localeCompare(b.date))
      return {
        test_code: meta.test_code,
        display_name: meta.display_name,
        unit: meta.unit,
        ref_low: meta.ref_low,
        ref_high: meta.ref_high,
        latest_value: meta.value,
        latest_flag: meta.flag,
        latest_trend: meta.trend,
        points: series,
      }
    })
    .filter((t) => t.points.length > 0)
}

/** Episodes that have report data — for the analytics dropdown. */
export function listReportEpisodeOptions(episodes: Episode[]): EpisodeTrendOption[] {
  return [...episodes]
    .filter((ep) => REPORT_STATES.has(ep.state) && ep.report?.values?.length)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((ep) => ({
      episode_id: ep.episode_id,
      label: episodeLabel(ep),
      report_date: ep.report!.received_at,
      summary_line: ep.summary_line,
    }))
}

/** Merge report values from episodes into one chronological series per test_code. */
export function buildParameterTrends(
  episodes: Episode[],
  filterEpisodeId: 'all' | string = 'all',
): ParameterTrend[] {
  const withReports = [...episodes]
    .filter((ep) => REPORT_STATES.has(ep.state) && ep.report?.values?.length)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  if (filterEpisodeId !== 'all') {
    const one = withReports.find((ep) => ep.episode_id === filterEpisodeId)
    return one ? trendsFromEpisode(one) : []
  }

  const byDate = indexEpisodesByReportDate(withReports)

  const map = new Map<
    string,
    {
      meta: ReportValue
      points: Map<string, TrendPoint>
    }
  >()

  for (const ep of withReports) {
    const report = ep.report!
    const reportDate = dateKey(report.received_at)

    for (const row of report.values) {
      let entry = map.get(row.test_code)
      if (!entry) {
        entry = { meta: row, points: new Map() }
        map.set(row.test_code, entry)
      }

      entry.meta = row

      for (const h of row.history ?? []) {
        const key = dateKey(h.date)
        entry.points.set(key, {
          date: key,
          value: h.value,
          ...resolvePointEpisode(h.date, ep, byDate),
        })
      }

      entry.points.set(reportDate, {
        date: reportDate,
        value: row.value,
        episode_id: ep.episode_id,
        episode_label: episodeLabel(ep),
      })
    }
  }

  return [...map.values()]
    .map(({ meta, points }) => {
      const series = [...points.values()].sort((a, b) => a.date.localeCompare(b.date))
      return {
        test_code: meta.test_code,
        display_name: meta.display_name,
        unit: meta.unit,
        ref_low: meta.ref_low,
        ref_high: meta.ref_high,
        latest_value: meta.value,
        latest_flag: meta.flag,
        latest_trend: meta.trend,
        points: series,
      }
    })
    .filter((t) => t.points.length > 0)
    .sort((a, b) => b.points.length - a.points.length)
}

export function formatTrendDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function shortTrendDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    year: '2-digit',
  })
}
