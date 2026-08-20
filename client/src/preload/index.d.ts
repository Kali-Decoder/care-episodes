type ElectronAPI = Record<string, unknown>

export type ProfileType = 'self' | 'family' | 'doctor' | 'community'

export interface Profile {
  id: string
  name: string
  type: ProfileType
  age?: number
  gender?: 'male' | 'female'
  createdAt: string
  avatarUrl?: string
}

export interface Session {
  slug: string
  name: string
  createdAt: string
  messageCount: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  thinking?: string
}

export interface AIStatus {
  isReady: boolean
  modelName: string
  uptime: number
  downloading: boolean
  downloadProgress: number
  error?: string
}

export type ModelSourceKind = 'http' | 'https' | 'registry' | 'file'

export interface ModelEntry {
  id: string
  name: string
  source: string
  sourceKind: ModelSourceKind
  size?: number
  quantization?: string
  params?: string
  description?: string
  createdAt: string
  builtin?: boolean
}

export interface ModelLoadProgress {
  phase: 'downloading' | 'loading'
  downloaded: number
  total: number
  percentage: number
  requestId?: string
}

export interface ModelErrorPayload {
  code: string
  message: string
  retryable: boolean
}

export interface ModelStatus {
  active: {
    id: string | null
    name: string
    source: string
    sourceKind: ModelSourceKind | null
    loaded: boolean
    requestId: string | null
    loadedAt: number | null
  }
  lastSelectedId: string | null
  available: ModelEntry[]
  /**
   * LoRA bound to the currently-loaded base model. `null` when
   * the user has not picked a LoRA, or when the active model is
   * the base model with no adapter.
   */
  activeLora: { id: string | null; name: string | null; path: string | null }
  /** True while a fine-tune run is in flight. */
  trainingActive: boolean
}

export interface ModelsAPI {
  list: () => Promise<ModelEntry[]>
  add: (entry: {
    name: string
    source: string
    description?: string
    quantization?: string
    params?: string
  }) => Promise<ModelEntry>
  remove: (id: string) => Promise<boolean>
  select: (id: string) => Promise<{ success: boolean; error?: string }>
  /**
   * Switch to a LoRA adapter. Pass `null` to switch back to the
   * active base model without any adapter. Re-loads the model
   * (re-using the active base model unless none is loaded, in
   * which case the lastSelected base model is used).
   */
  selectLora: (loraId: string | null) => Promise<{ success: boolean; error?: string }>
  cancel: (opts?: { clearCache?: boolean }) => Promise<{ success: boolean }>
  resetCache: (id: string) => Promise<{ success: boolean; deleted: string[]; error?: string }>
  status: () => Promise<ModelStatus>
  pickFile: () => Promise<string | null>
  onProgress: (callback: (p: ModelLoadProgress) => void) => () => void
  onError: (callback: (e: ModelErrorPayload) => void) => () => void
}

export interface DatasetCustomDataSource {
  kind: 'jsonl-text' | 'text' | 'jsonl-file'
  label: string
  text?: string
  path?: string
}

export interface DatasetEntry {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  sources: {
    simulationIds: string[]
    customData: DatasetCustomDataSource[]
  }
  sampleCount: number
  /**
   * SFT (Supervised Fine-Tuning) JSONL path. `null` if the dataset
   * has no SFT content (e.g. a Causal-only dataset of plain text).
   */
  trainJsonlPath: string | null
  /**
   * Causal plain-text path. `null` if the dataset has no plain-text
   * content (e.g. a SFT-only dataset of simulation outcomes).
   */
  trainTxtPath: string | null
}

export interface DatasetsAPI {
  list: () => Promise<DatasetEntry[]>
  get: (id: string) => Promise<DatasetEntry | null>
  create: (entry: { name: string; sources: { simulationIds: string[]; customData: DatasetCustomDataSource[] }; profileSlug: string }) => Promise<DatasetEntry>
  update: (id: string, patch: { name?: string; sources?: { simulationIds: string[]; customData: DatasetCustomDataSource[] } }, profileSlug: string) => Promise<DatasetEntry | null>
  delete: (id: string) => Promise<{ success: boolean }>
  importJsonl: () => Promise<string | null>
}

export interface TrainingRunOptions {
  numberOfEpochs: number
  learningRate: number
  loraRank: number
  loraAlpha: number
  contextLength: number
  batchSize: number
  microBatchSize: number
  assistantLossOnly: boolean
}

export interface TrainingRunProgress {
  epoch: number
  step: number
  totalSteps: number
  loss: number | null
  eta: number | null
}

export interface TrainingRun {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  datasetId: string
  baseModelId: string
  options: TrainingRunOptions
  status: 'queued' | 'running' | 'paused' | 'done' | 'failed' | 'canceled'
  progress: TrainingRunProgress
  outputLoraPath: string | null
  loraId: string | null
  error: string | null
}

export interface TrainingsAPI {
  list: () => Promise<TrainingRun[]>
  get: (id: string) => Promise<TrainingRun | null>
  start: (payload: { name: string; datasetId: string; baseModelId: string; options: TrainingRunOptions }) => Promise<TrainingRun>
  pause: (id: string) => Promise<{ success: boolean }>
  resume: (id: string) => Promise<{ success: boolean }>
  cancelRun: (id: string) => Promise<{ success: boolean }>
  delete: (id: string) => Promise<{ success: boolean }>
  onProgress: (callback: (p: { runId: string; epoch: number; step: number; totalSteps: number; loss: number | null; eta: number | null }) => void) => () => void
}

export interface LoraEntry {
  id: string
  name: string
  baseModelId: string
  loraPath: string
  source: 'training' | 'imported'
  trainingRunId: string | null
  createdAt: string
  sizeBytes?: number
}

export interface LorasAPI {
  list: () => Promise<LoraEntry[]>
  get: (id: string) => Promise<LoraEntry | null>
  delete: (id: string) => Promise<{ success: boolean; removed?: LoraEntry }>
  import: () => Promise<LoraEntry | null>
}

export type SupportedTargetLang =
  | 'es' | 'fr' | 'de' | 'it' | 'pt'
  | 'ru' | 'zh' | 'ja' | 'ko'
  | 'ar' | 'hi'
  | 'nl' | 'pl' | 'tr' | 'sv' | 'vi'
  | 'el' | 'he'

export interface TranslationStatus {
  loaded: boolean
  targetLang: SupportedTargetLang | null
  /** Display label for the currently loaded language (e.g. "Español"). */
  targetLabel: string | null
  loading: boolean
  error: string | null
}

export interface TranslationAPI {
  supportedLanguages: () => Promise<Array<{ code: SupportedTargetLang; label: string }>>
  status: () => Promise<TranslationStatus>
  load: (lang: SupportedTargetLang) => Promise<{ success: boolean; modelId?: string; error?: string }>
  unload: () => Promise<{ success: boolean; error?: string }>
}

export interface P2PPeer {
  id: string
  name: string
  publicKey: string
  createdAt: string
}

export interface P2PStatus {
  provider: {
    enabled: boolean
    running: boolean
    starting: boolean
    publicKey: string | null
    seedExists: boolean
    error: string | null
  }
  consumer: {
    enabled: boolean
    activePeerId: string | null
    activePeer: P2PPeer | null
    peers: P2PPeer[]
    outcomeModelLoaded: boolean
    delegatedTo: { publicKey: string; peerName: string } | null
    error: string | null
  }
}

export interface P2PAPI {
  status: () => Promise<P2PStatus>
  providerStart: () => Promise<{ success: boolean; publicKey?: string; error?: string }>
  providerStop: () => Promise<{ success: boolean; error?: string }>
  providerSetEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>
  consumerSetEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>
  peersList: () => Promise<{ peers: P2PPeer[] }>
  peersAdd: (input: { name: string; publicKey: string }) => Promise<{ success: boolean; peer?: P2PPeer; error?: string }>
  peersRemove: (id: string) => Promise<{ success: boolean; error?: string }>
  peersConnect: (id: string) => Promise<{ success: boolean; error?: string }>
  peersDisconnect: () => Promise<{ success: boolean; error?: string }>
  onStatus: (callback: (s: P2PStatus) => void) => () => void
}

export interface ProfileAPI {
  profiles: {
    getAll: () => Promise<Profile[]>
    add: (profile: { name: string; type: ProfileType; age?: number; gender?: 'male' | 'female' }) => Promise<Profile>
    remove: (id: string) => Promise<boolean>
  }
  models: ModelsAPI
  ai: {
    getStatus: () => Promise<AIStatus>
    load: () => Promise<{ success: boolean; status?: AIStatus; error?: string }>
    unload: () => Promise<{ success: boolean; error?: string }>
    reload: () => Promise<{ success: boolean; status?: AIStatus; error?: string }>
    sendMessage: (profileSlug: string, sessionSlug: string, message: string, history: ChatMessage[], profile?: { name: string; type: string; age?: number; gender?: string }) => Promise<{ success: boolean; error?: string }>
    generateScenario: (profileSlug: string, payload: { prompt: string }) => Promise<{ ok: boolean; name?: string; description?: string; error?: string }>
    onDownloadProgress: (callback: (progress: number) => void) => () => void
    onLoadProgress: (callback: (msg: string) => void) => () => void
    onStreamToken: (callback: (token: string) => void) => () => void
    onStreamThinking: (callback: (thinking: string) => void) => () => void
    onStreamDone: (callback: () => void) => () => void
    onError: (callback: (error: string) => void) => () => void
  }
  sessions: {
    list: (profileSlug: string) => Promise<Session[]>
    create: (profileSlug: string, sessionSlug: string) => Promise<{ path: string; messagesPath: string }>
    delete: (profileSlug: string, sessionSlug: string) => Promise<{ success: boolean }>
    clearMessages: (profileSlug: string, sessionSlug: string) => Promise<{ success: boolean }>
    loadMessages: (profileSlug: string, sessionSlug: string) => Promise<Message[]>
    saveMessages: (profileSlug: string, sessionSlug: string, messages: Message[]) => Promise<{ success: boolean }>
  }
  settings: {
    get: () => Promise<{ ctx_size: number; workerEnabled: boolean; maxCards: number }>
    setCtxSize: (ctx_size: number) => Promise<{ success: boolean }>
    setWorkerEnabled: (enabled: boolean) => Promise<{ success: boolean }>
    setMaxCards: (maxCards: number) => Promise<{ success: boolean }>
  }
  documents: {
    list: () => Promise<any[]>
    get: (docId: string) => Promise<any>
    add: (doc: { type: 'text' | 'ocr' | 'note'; name: string; content: string; metadata?: Record<string, unknown> }) => Promise<any>
    update: (docId: string, updates: any) => Promise<{ success: boolean; document?: any }>
    delete: (docId: string) => Promise<{ success: boolean }>
    search: (query: string) => Promise<any[]>
    setProfile: (profileSlug: string) => Promise<{ success: boolean }>
    processOcr: (imagePath: string) => Promise<{ success: boolean; text?: string; error?: string }>
  }
  simulations: {
    list: (profileSlug: string) => Promise<any[]>
    get: (profileSlug: string, simId: string) => Promise<any>
    create: (profileSlug: string, name: string, description: string, canvas: any) => Promise<any>
    delete: (profileSlug: string, simId: string) => Promise<{ success: boolean }>
    requeue: (profileSlug: string, simId: string, outcomeId?: string) => Promise<{ success: boolean; requeued: number }>
    getOutcome: (profileSlug: string, simId: string, outcomeId: string) => Promise<any>
    listOutcomes: (profileSlug: string, simId: string) => Promise<any[]>
    getReport: (profileSlug: string, simId: string) => Promise<any>
    /**
     * Translate the on-screen report in place. The main process
     * re-fetches the report, runs it through Bergamot, and returns
     * a translated `ReportResponse` (chrome in English, user-visible
     * content in `targetLang`). The renderer overlays this on top of
     * the original `data` so the user sees a translated page; the
     * English original is preserved underneath.
     */
    translateReport: (
      profileSlug: string,
      simId: string,
      targetLang: SupportedTargetLang,
    ) => Promise<any>
    setModalOpen: (profileSlug: string, isOpen: boolean) => Promise<void>
    /**
     * Export whatever the page is currently showing. If `data` is
     * supplied (the typical case for a translated page), the writer
     * renders it as-is — no re-fetch, no translate. If `data` is
     * omitted, the writer re-fetches the report from disk and writes
     * the original English.
     */
    exportReport: (
      profileSlug: string,
      simId: string,
      format: 'pdf' | 'json' | 'md' | 'csv',
      data?: any,
    ) => Promise<{ ok: boolean; canceled?: boolean; path?: string; error?: string }>
    onProgress: (callback: (event: any) => void) => () => void
  }
  datasets: DatasetsAPI
  trainings: TrainingsAPI
  loras: LorasAPI
  p2p: P2PAPI
  translation: TranslationAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ProfileAPI
  }
}