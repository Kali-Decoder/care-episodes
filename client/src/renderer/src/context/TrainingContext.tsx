import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  DatasetEntry,
  LoraEntry,
  TrainingRun,
  TrainingRunProgress,
} from '../../../preload/index.d'

/**
 * Renderer-side state for the Training / Datasets / LoRAs namespaces.
 * Wraps the `datasets:*` / `trainings:*` / `loras:*` IPCs and subscribes
 * to the `trainings:progress` push channel so any page that mounts
 * inside the provider sees live progress.
 */

interface TrainingContextValue {
  datasets: DatasetEntry[]
  trainings: TrainingRun[]
  loras: LoraEntry[]
  /** Per-run live progress keyed by runId. */
  progress: Record<string, TrainingRunProgress | null>
  refresh: () => Promise<void>
  refreshDatasets: () => Promise<void>
  refreshTrainings: () => Promise<void>
  refreshLoras: () => Promise<void>
}

const TrainingContext = createContext<TrainingContextValue | null>(null)

export function TrainingProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<DatasetEntry[]>([])
  const [trainings, setTrainings] = useState<TrainingRun[]>([])
  const [loras, setLoras] = useState<LoraEntry[]>([])
  const [progress, setProgress] = useState<Record<string, TrainingRunProgress | null>>({})
  const mounted = useRef(true)

  const refreshDatasets = useCallback(async () => {
    if (!window.api?.datasets?.list) return
    try {
      const list = await window.api.datasets.list()
      if (mounted.current) setDatasets(list)
    } catch (e) {
      console.error('[TrainingContext] datasets list failed:', e)
    }
  }, [])

  const refreshTrainings = useCallback(async () => {
    if (!window.api?.trainings?.list) return
    try {
      const list = await window.api.trainings.list()
      if (mounted.current) setTrainings(list)
    } catch (e) {
      console.error('[TrainingContext] trainings list failed:', e)
    }
  }, [])

  const refreshLoras = useCallback(async () => {
    if (!window.api?.loras?.list) return
    try {
      const list = await window.api.loras.list()
      if (mounted.current) setLoras(list)
    } catch (e) {
      console.error('[TrainingContext] loras list failed:', e)
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([refreshDatasets(), refreshTrainings(), refreshLoras()])
  }, [refreshDatasets, refreshTrainings, refreshLoras])

  useEffect(() => {
    mounted.current = true
    refresh()

    const off = window.api.trainings?.onProgress?.((p) => {
      if (!mounted.current) return
      setProgress((prev) => ({
        ...prev,
        [p.runId]: {
          epoch: p.epoch,
          step: p.step,
          totalSteps: p.totalSteps,
          loss: p.loss,
          eta: p.eta,
        },
      }))
      // Pull the latest run list on every tick so the row's status chip
      // flips to "running" / "done" without waiting for a manual refresh.
      refreshTrainings()
    })

    return () => {
      mounted.current = false
      off?.()
    }
  }, [refresh, refreshTrainings])

  return (
    <TrainingContext.Provider
      value={{
        datasets,
        trainings,
        loras,
        progress,
        refresh,
        refreshDatasets,
        refreshTrainings,
        refreshLoras,
      }}
    >
      {children}
    </TrainingContext.Provider>
  )
}

export function useTraining() {
  const ctx = useContext(TrainingContext)
  if (!ctx) {
    throw new Error('useTraining must be used within <TrainingProvider>')
  }
  return ctx
}
