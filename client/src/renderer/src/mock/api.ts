/**
 * In-memory mock of `window.api` so every renderer screen can be exercised
 * without Electron, QVAC, or a real model. Installed from main.tsx.
 */

import type {
  ChatMessage,
  DatasetEntry,
  LoraEntry,
  ModelEntry,
  ModelErrorPayload,
  ModelLoadProgress,
  ModelStatus,
  P2PPeer,
  P2PStatus,
  Profile,
  ProfileAPI,
  Session,
  SupportedTargetLang,
  TrainingRun,
  TrainingRunOptions,
  TranslationStatus,
} from '../../../preload/index.d'
import type {
  CanvasState,
  SimulationOutcome,
  SimulationParent,
  SimulationProgressEvent,
} from '../../../preload/simulation'
import type { ParsedOutcomeReport } from '../../../shared/outcomeParser'
import { aggregateOutcomes } from '../../../shared/outcomeReport'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function createHub<T>() {
  const listeners = new Set<(value: T) => void>()
  return {
    on(callback: (value: T) => void) {
      listeners.add(callback)
      return () => {
        listeners.delete(callback)
      }
    },
    emit(value: T) {
      listeners.forEach((cb) => cb(value))
    },
  }
}

export const MOCK_PROFILE: Profile = {
  id: 'profile-demo',
  name: 'Alex Rivera',
  type: 'self',
  age: 34,
  gender: 'female',
  createdAt: '2026-03-12T10:00:00.000Z',
}

const profiles: Profile[] = [
  MOCK_PROFILE,
  {
    id: 'profile-family',
    name: 'Jordan Chen',
    type: 'family',
    createdAt: '2026-04-02T08:30:00.000Z',
  },
  {
    id: 'profile-clinic',
    name: 'Dr. Patel',
    type: 'doctor',
    createdAt: '2026-05-18T14:12:00.000Z',
  },
]

const builtinModel: ModelEntry = {
  id: 'model-medpsy',
  name: 'QVAC MedPsy (mock)',
  source: 'mock://qvac-medpsy',
  sourceKind: 'registry',
  size: 4_200_000_000,
  quantization: 'Q4_K_M',
  params: '8B',
  description: 'Mocked local medical model for UI testing.',
  createdAt: '2026-01-01T00:00:00.000Z',
  builtin: true,
}

const models: ModelEntry[] = [
  builtinModel,
  {
    id: 'model-custom',
    name: 'Clinic Fine-tune',
    source: '/Users/demo/models/clinic.gguf',
    sourceKind: 'file',
    size: 2_100_000_000,
    quantization: 'Q5_K_S',
    params: '3B',
    description: 'Custom GGUF added for mock testing.',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
]

let activeModelId: string | null = builtinModel.id
let activeLoaded = true
let lastSelectedId: string | null = builtinModel.id
let loadedAt: number | null = Date.now() - 12 * 60 * 1000
let activeLoraId: string | null = 'lora-asthma'
let trainingActive = false

const canvas: CanvasState = {
  cards: [
    {
      id: 'env-urban-school-bkk',
      category: 'exposure',
      title: 'Urban School',
      tone: 'blue',
      placementId: 'card-expo-1',
      x: 80,
      y: 120,
      collapsed: false,
      exposureFields: { dose: '35 µg/m³', unit: 'PM2.5', duration: 'school hours', setting: 'Bangkok' },
    },
    {
      id: 'subj-school-children',
      category: 'subject',
      title: 'School children 7–12',
      tone: 'teal',
      placementId: 'card-subj-1',
      x: 360,
      y: 80,
      collapsed: false,
      subjectFields: { ageRange: '7-12', sampleSize: 'n=120', region: 'Bangkok' },
    },
    {
      id: 'int-hepa-filter',
      category: 'intervention',
      title: 'Classroom HEPA filters',
      tone: 'navy',
      placementId: 'card-int-1',
      x: 640,
      y: 140,
      collapsed: false,
      interventionFields: { type: 'device', intensity: 'school-wide', compliance: 'high' },
    },
  ],
  connections: [
    { id: 'conn-1', from: 'card-expo-1', to: 'card-subj-1' },
    { id: 'conn-2', from: 'card-subj-1', to: 'card-int-1' },
  ],
}

const simulations: SimulationParent[] = [
  {
    id: 'sim-urban-asthma',
    profileSlug: MOCK_PROFILE.id,
    name: 'Urban school asthma paths',
    description: 'PM2.5 exposure vs classroom filtration for school-age children.',
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-08-18T16:40:00.000Z',
    status: 'completed',
    canvas,
    outcomeCount: 2,
    completedCount: 2,
    errorCount: 0,
  },
  {
    id: 'sim-heat-elderly',
    profileSlug: MOCK_PROFILE.id,
    name: 'Heat-wave elderly risk',
    description: 'Outdoor heat plus hydration outreach.',
    createdAt: '2026-08-10T11:20:00.000Z',
    updatedAt: '2026-08-19T08:05:00.000Z',
    status: 'partial',
    canvas,
    outcomeCount: 2,
    completedCount: 1,
    errorCount: 1,
  },
]

const outcomes: SimulationOutcome[] = [
  {
    id: 'out-1',
    simId: 'sim-urban-asthma',
    sessionSlug: 'session-sim-1',
    interventionId: 'card-int-1',
    pathLabels: {
      subject: 'School children 7–12',
      exposure: 'Urban School',
      intervention: 'Classroom HEPA filters',
    },
    details: {
      subject: { ageRange: '7-12', sampleSize: 'n=120' },
      exposure: { dose: '35 µg/m³' },
      intervention: { type: 'device', compliance: 'high' },
    },
    status: 'done',
    createdAt: '2026-08-14T09:05:00.000Z',
    updatedAt: '2026-08-14T09:12:00.000Z',
  },
  {
    id: 'out-2',
    simId: 'sim-urban-asthma',
    sessionSlug: 'session-sim-2',
    interventionId: 'card-int-1',
    pathLabels: {
      subject: 'School children 7–12',
      exposure: 'Urban School',
      intervention: 'Classroom HEPA filters',
    },
    status: 'done',
    createdAt: '2026-08-14T09:13:00.000Z',
    updatedAt: '2026-08-14T09:20:00.000Z',
  },
  {
    id: 'out-3',
    simId: 'sim-heat-elderly',
    sessionSlug: 'session-sim-3',
    interventionId: 'card-int-1',
    pathLabels: {
      subject: 'Adults 65+',
      exposure: 'Outdoor heat',
      intervention: 'Hydration outreach',
    },
    status: 'done',
    createdAt: '2026-08-10T11:25:00.000Z',
    updatedAt: '2026-08-10T11:40:00.000Z',
  },
  {
    id: 'out-4',
    simId: 'sim-heat-elderly',
    sessionSlug: 'session-sim-4',
    interventionId: 'card-int-1',
    pathLabels: {
      subject: 'Adults 65+',
      exposure: 'Outdoor heat',
      intervention: 'Hydration outreach',
    },
    status: 'error',
    error: 'Mock worker timeout',
    createdAt: '2026-08-10T11:41:00.000Z',
    updatedAt: '2026-08-10T11:45:00.000Z',
  },
]

function mockParsed(risk: number, summary: string): ParsedOutcomeReport {
  return {
    summary,
    risk,
    severeCaseRate: Math.max(1, Math.round(risk / 5)),
    riskRange: [Math.max(0, risk - 8), Math.min(100, risk + 8)],
    severeCaseRateRange: [1, 12],
    keyDrivers: ['Ambient PM2.5 during recess', 'Indoor classroom ventilation', 'Baseline asthma prevalence'],
    recommendations: ['Install portable HEPA units', 'Shift outdoor PE on high-AQI days', 'Screen symptomatic children'],
    uncertainty: 'Mock estimates only — not clinical advice.',
    fullText: summary,
  }
}

const reports: Record<string, ParsedOutcomeReport | null> = {
  'out-1': mockParsed(28, 'Filtration lowers moderate asthma exacerbation risk in the classroom cohort.'),
  'out-2': mockParsed(36, 'Residual outdoor recess exposure keeps risk in the mid-30s without schedule changes.'),
  'out-3': mockParsed(54, 'Heat plus limited cooling access drives elevated risk for older adults.'),
  'out-4': null,
}

const sessionStore: Record<string, Session[]> = {
  [MOCK_PROFILE.id]: [
    {
      slug: 'main',
      name: 'Main',
      createdAt: '2026-08-18T08:00:00.000Z',
      messageCount: 0,
    },
    {
      slug: 'session-welcome',
      name: 'Welcome chat',
      createdAt: '2026-08-18T09:00:00.000Z',
      messageCount: 2,
    },
    {
      slug: 'session-followup',
      name: 'Follow-up questions',
      createdAt: '2026-08-19T13:22:00.000Z',
      messageCount: 1,
    },
  ],
}

const messageStore: Record<string, ChatMessage[]> = {
  [`${MOCK_PROFILE.id}:session-welcome`]: [
    {
      id: 'm1',
      role: 'user',
      content: 'What should a school nurse watch for during high PM2.5 days?',
      timestamp: '2026-08-18T09:01:00.000Z',
    },
    {
      id: 'm2',
      role: 'assistant',
      content:
        '**Mock reply.** Watch for wheeze, tight chest, and reduced PE participation. Keep rescue inhalers accessible and move PE indoors when AQI is high.\n\nThis is simulated output for UI testing.',
      timestamp: '2026-08-18T09:01:08.000Z',
      thinking: 'User asked about school nursing on high-PM days. Keep it practical and non-diagnostic.',
    },
  ],
  [`${MOCK_PROFILE.id}:session-followup`]: [
    {
      id: 'm3',
      role: 'user',
      content: 'Can we reuse yesterday’s simulation for training?',
      timestamp: '2026-08-19T13:23:00.000Z',
    },
  ],
}

const datasets: DatasetEntry[] = [
  {
    id: 'ds-1',
    name: 'Asthma path SFT',
    createdAt: '2026-08-12T00:00:00.000Z',
    updatedAt: '2026-08-16T00:00:00.000Z',
    sources: {
      simulationIds: ['sim-urban-asthma'],
      customData: [{ kind: 'text', label: 'nurse notes.txt', text: 'Mock notes' }],
    },
    sampleCount: 48,
    trainJsonlPath: '/mock/datasets/ds-1.jsonl',
    trainTxtPath: '/mock/datasets/ds-1.txt',
  },
]

const trainings: TrainingRun[] = [
  {
    id: 'run-1',
    name: 'Asthma LoRA run',
    createdAt: '2026-08-16T10:00:00.000Z',
    updatedAt: '2026-08-16T12:10:00.000Z',
    datasetId: 'ds-1',
    baseModelId: builtinModel.id,
    options: {
      numberOfEpochs: 3,
      learningRate: 0.0002,
      loraRank: 16,
      loraAlpha: 32,
      contextLength: 4096,
      batchSize: 8,
      microBatchSize: 1,
      assistantLossOnly: true,
    },
    status: 'done',
    progress: { epoch: 3, step: 120, totalSteps: 120, loss: 0.42, eta: 0 },
    outputLoraPath: '/mock/loras/asthma',
    loraId: 'lora-asthma',
    error: null,
  },
]

const loras: LoraEntry[] = [
  {
    id: 'lora-asthma',
    name: 'Asthma adapter',
    baseModelId: builtinModel.id,
    loraPath: '/mock/loras/asthma',
    source: 'training',
    trainingRunId: 'run-1',
    createdAt: '2026-08-16T12:10:00.000Z',
    sizeBytes: 48_000_000,
  },
]

type Doc = {
  id: string
  type: 'text' | 'ocr' | 'note'
  name: string
  content: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

const documents: Doc[] = [
  {
    id: 'doc-1',
    type: 'note',
    name: 'Clinic briefing',
    content: 'Mock note: review HEPA placement in rooms 2 and 4 before monsoon term.',
    metadata: {},
    createdAt: '2026-08-15T08:00:00.000Z',
    updatedAt: '2026-08-15T08:00:00.000Z',
  },
  {
    id: 'doc-2',
    type: 'ocr',
    name: 'Peak-flow log.jpg',
    content: 'OCR (mock): 18 Aug  AM 240  PM 210  notes: after PE',
    metadata: { originalName: 'peak-flow.jpg', mimeType: 'image/jpeg' },
    createdAt: '2026-08-18T07:40:00.000Z',
    updatedAt: '2026-08-18T07:40:00.000Z',
  },
]

let settings = { ctx_size: 4096, workerEnabled: true, maxCards: 12 }

const peers: P2PPeer[] = [
  {
    id: 'peer-1',
    name: 'Community clinic node',
    publicKey: 'pk_mock_clinic_node_aa11',
    createdAt: '2026-07-01T00:00:00.000Z',
  },
]

const p2pStatus: P2PStatus = {
  provider: {
    enabled: true,
    running: false,
    starting: false,
    publicKey: 'pk_mock_this_device',
    seedExists: true,
    error: null,
  },
  consumer: {
    enabled: false,
    activePeerId: null,
    activePeer: null,
    peers,
    outcomeModelLoaded: true,
    delegatedTo: null,
    error: null,
  },
}

const langs: Array<{ code: SupportedTargetLang; label: string }> = [
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'hi', label: 'हिन्दी' },
]

let translation: TranslationStatus = {
  loaded: false,
  targetLang: null,
  targetLabel: null,
  loading: false,
  error: null,
}

const modelProgress = createHub<ModelLoadProgress>()
const modelError = createHub<ModelErrorPayload>()
const streamToken = createHub<string>()
const streamThinking = createHub<string>()
const streamDone = createHub<void>()
const aiError = createHub<string>()
const simProgress = createHub<SimulationProgressEvent>()
const trainingProgress = createHub<{
  runId: string
  epoch: number
  step: number
  totalSteps: number
  loss: number | null
  eta: number | null
}>()
const p2pHub = createHub<P2PStatus>()

function modelStatus(): ModelStatus {
  const active = models.find((m) => m.id === activeModelId) ?? builtinModel
  const lora = loras.find((l) => l.id === activeLoraId) ?? null
  return {
    active: {
      id: activeModelId,
      name: active.name,
      source: active.source,
      sourceKind: active.sourceKind,
      loaded: activeLoaded,
      requestId: activeLoaded ? 'mock-req' : null,
      loadedAt,
    },
    lastSelectedId,
    available: [...models],
    activeLora: {
      id: lora?.id ?? null,
      name: lora?.name ?? null,
      path: lora?.loraPath ?? null,
    },
    trainingActive,
  }
}

function buildReport(simId: string) {
  const sim = simulations.find((s) => s.id === simId)
  if (!sim) throw new Error(`Unknown simulation ${simId}`)
  const simOutcomes = outcomes.filter((o) => o.simId === simId)
  const reportMap = new Map<string, ParsedOutcomeReport | null>()
  for (const o of simOutcomes) reportMap.set(o.id, reports[o.id] ?? null)
  return {
    sim,
    outcomes: simOutcomes,
    reports: Object.fromEntries(reportMap),
    aggregate: aggregateOutcomes(simOutcomes, reportMap),
  }
}

async function simulateLoad(id: string) {
  activeModelId = id
  lastSelectedId = id
  activeLoaded = false
  loadedAt = null
  for (let p = 10; p <= 100; p += 18) {
    modelProgress.emit({
      phase: 'downloading',
      downloaded: p,
      total: 100,
      percentage: p,
      requestId: 'mock-req',
    })
    await wait(80)
  }
  for (let p = 15; p <= 100; p += 20) {
    modelProgress.emit({
      phase: 'loading',
      downloaded: p,
      total: 100,
      percentage: p,
      requestId: 'mock-req',
    })
    await wait(70)
  }
  activeLoaded = true
  loadedAt = Date.now()
  modelProgress.emit({
    phase: 'loading',
    downloaded: 100,
    total: 100,
    percentage: 100,
    requestId: 'mock-req',
  })
}

async function streamText(thinking: string, content: string) {
  for (const chunk of thinking.match(/.{1,12}/g) ?? []) {
    streamThinking.emit(chunk)
    await wait(12)
  }
  for (const chunk of content.match(/.{1,8}/g) ?? []) {
    streamToken.emit(chunk)
    await wait(16)
  }
  streamDone.emit(undefined)
}

function sessionKey(profileSlug: string, slug: string) {
  return `${profileSlug}:${slug}`
}

export function createMockApi(): ProfileAPI {
  const api: ProfileAPI = {
    profiles: {
      getAll: async () => [...profiles],
      add: async (profile) => {
        const created: Profile = {
          ...profile,
          id: `profile-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        profiles.push(created)
        return created
      },
      remove: async (id) => {
        const i = profiles.findIndex((p) => p.id === id)
        if (i < 0) return false
        profiles.splice(i, 1)
        return true
      },
    },
    models: {
      list: async () => [...models],
      add: async (entry) => {
        const created: ModelEntry = {
          id: `model-${Date.now()}`,
          name: entry.name,
          source: entry.source,
          sourceKind: entry.source.startsWith('/') || entry.source.includes(':\\') ? 'file' : 'https',
          quantization: entry.quantization,
          params: entry.params,
          description: entry.description,
          createdAt: new Date().toISOString(),
        }
        models.push(created)
        return created
      },
      remove: async (id) => {
        const i = models.findIndex((m) => m.id === id && !m.builtin)
        if (i < 0) return false
        models.splice(i, 1)
        return true
      },
      select: async (id) => {
        if (!models.some((m) => m.id === id)) return { success: false, error: 'Unknown model' }
        void simulateLoad(id)
        return { success: true }
      },
      selectLora: async (loraId) => {
        if (loraId && !loras.some((l) => l.id === loraId)) {
          return { success: false, error: 'Unknown LoRA' }
        }
        activeLoraId = loraId
        return { success: true }
      },
      cancel: async () => {
        activeLoaded = false
        return { success: true }
      },
      resetCache: async (id) => ({ success: true, deleted: [`cache:${id}`] }),
      status: async () => modelStatus(),
      pickFile: async () => '/Users/demo/models/picked-model.gguf',
      onProgress: (cb) => modelProgress.on(cb),
      onError: (cb) => modelError.on(cb),
    },
    ai: {
      getStatus: async () => ({
        isReady: activeLoaded,
        modelName: models.find((m) => m.id === activeModelId)?.name ?? 'Mock model',
        uptime: loadedAt ? Math.floor((Date.now() - loadedAt) / 1000) : 0,
        downloading: false,
        downloadProgress: 100,
      }),
      load: async () => ({ success: true, status: await api.ai.getStatus() }),
      unload: async () => {
        activeLoaded = false
        return { success: true }
      },
      reload: async () => {
        if (activeModelId) void simulateLoad(activeModelId)
        return { success: true }
      },
      sendMessage: async (profileSlug, sessionSlug, message) => {
        const key = sessionKey(profileSlug, sessionSlug)
        const existing = messageStore[key] ?? []
        existing.push({
          id: `u-${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        })
        messageStore[key] = existing
        const reply = `**Mock assistant** responding to: “${message.slice(0, 80)}”\n\n- This path is fully local.\n- No model is loaded.\n- Use this to exercise chat, markdown, and session chrome.`
        void (async () => {
          await streamText('Drafting a mock clinical-sandbox reply… ', reply)
          existing.push({
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: reply,
            timestamp: new Date().toISOString(),
            thinking: 'Drafting a mock clinical-sandbox reply…',
          })
        })()
        return { success: true }
      },
      generateScenario: async (_profileSlug, payload) => {
        const cards = [
          {
            id: 'mock-subj',
            category: 'subject',
            title: 'Adults 35–55',
            tone: 'teal',
            subjectFields: { ageRange: '35-55', sampleSize: 'n=80', region: payload.prompt.slice(0, 40) },
          },
          {
            id: 'mock-expo',
            category: 'exposure',
            title: 'Traffic corridor PM2.5',
            tone: 'blue',
            exposureFields: { dose: '42 µg/m³', duration: 'weekday commute' },
          },
          {
            id: 'mock-int',
            category: 'intervention',
            title: 'N95 for outdoor workers',
            tone: 'navy',
            interventionFields: { type: 'device', compliance: 'moderate' },
          },
        ]
        const jsonl = cards.map((c) => JSON.stringify(c)).join('\n')
        await streamText('Enumerating mock canvas cards… ', jsonl)
        return {
          ok: true,
          name: 'Prompt scenario (mock)',
          description: payload.prompt || 'Generated mock scenario',
        }
      },
      onDownloadProgress: (cb) => {
        const off = modelProgress.on((p) => cb(p.percentage))
        return off
      },
      onLoadProgress: (cb) => {
        const off = modelProgress.on((p) => cb(`${p.phase} ${p.percentage}%`))
        return off
      },
      onStreamToken: (cb) => streamToken.on(cb),
      onStreamThinking: (cb) => streamThinking.on(cb),
      onStreamDone: (cb) => streamDone.on(() => cb()),
      onError: (cb) => aiError.on(cb),
    },
    sessions: {
      list: async (profileSlug) => [...(sessionStore[profileSlug] ?? [])],
      create: async (profileSlug, sessionSlug) => {
        const list = sessionStore[profileSlug] ?? []
        list.unshift({
          slug: sessionSlug,
          name: sessionSlug.replace(/-/g, ' '),
          createdAt: new Date().toISOString(),
          messageCount: 0,
        })
        sessionStore[profileSlug] = list
        messageStore[sessionKey(profileSlug, sessionSlug)] = []
        return { path: `/mock/${profileSlug}/${sessionSlug}`, messagesPath: `/mock/${profileSlug}/${sessionSlug}.json` }
      },
      delete: async (profileSlug, sessionSlug) => {
        sessionStore[profileSlug] = (sessionStore[profileSlug] ?? []).filter((s) => s.slug !== sessionSlug)
        delete messageStore[sessionKey(profileSlug, sessionSlug)]
        return { success: true }
      },
      clearMessages: async (profileSlug, sessionSlug) => {
        messageStore[sessionKey(profileSlug, sessionSlug)] = []
        const s = (sessionStore[profileSlug] ?? []).find((x) => x.slug === sessionSlug)
        if (s) s.messageCount = 0
        return { success: true }
      },
      loadMessages: async (profileSlug, sessionSlug) => messageStore[sessionKey(profileSlug, sessionSlug)] ?? [],
      saveMessages: async (profileSlug, sessionSlug, messages) => {
        messageStore[sessionKey(profileSlug, sessionSlug)] = messages
        return { success: true }
      },
    },
    settings: {
      get: async () => ({ ...settings }),
      setCtxSize: async (ctx_size) => {
        settings = { ...settings, ctx_size }
        return { success: true }
      },
      setWorkerEnabled: async (enabled) => {
        settings = { ...settings, workerEnabled: enabled }
        return { success: true }
      },
      setMaxCards: async (maxCards) => {
        settings = { ...settings, maxCards }
        return { success: true }
      },
    },
    documents: {
      list: async () => [...documents],
      get: async (docId) => documents.find((d) => d.id === docId) ?? null,
      add: async (doc) => {
        const created: Doc = {
          id: `doc-${Date.now()}`,
          type: doc.type,
          name: doc.name,
          content: doc.content,
          metadata: doc.metadata ?? {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        documents.unshift(created)
        return created
      },
      update: async (docId, updates) => {
        const doc = documents.find((d) => d.id === docId)
        if (!doc) return { success: false }
        Object.assign(doc, updates, { updatedAt: new Date().toISOString() })
        return { success: true, document: doc }
      },
      delete: async (docId) => {
        const i = documents.findIndex((d) => d.id === docId)
        if (i >= 0) documents.splice(i, 1)
        return { success: true }
      },
      search: async (query) =>
        documents.filter((d) => `${d.name} ${d.content}`.toLowerCase().includes(query.toLowerCase())),
      setProfile: async () => ({ success: true }),
      processOcr: async (imagePath) => ({
        success: true,
        text: `Mock OCR of ${imagePath}: peak flow 240 / 210, notes after PE.`,
      }),
    },
    simulations: {
      list: async (profileSlug) => simulations.filter((s) => s.profileSlug === profileSlug),
      get: async (_profileSlug, simId) => simulations.find((s) => s.id === simId) ?? null,
      create: async (profileSlug, name, description, nextCanvas) => {
        const sim: SimulationParent = {
          id: `sim-${Date.now()}`,
          profileSlug,
          name,
          description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'processing',
          canvas: nextCanvas,
          outcomeCount: 1,
          completedCount: 0,
          errorCount: 0,
        }
        simulations.unshift(sim)
        const outcome: SimulationOutcome = {
          id: `out-${Date.now()}`,
          simId: sim.id,
          sessionSlug: `session-${sim.id}`,
          interventionId: nextCanvas?.cards?.find((c: { category: string }) => c.category === 'intervention')?.placementId ?? 'int',
          pathLabels: {
            subject: 'Mock subject',
            exposure: 'Mock exposure',
            intervention: 'Mock intervention',
          },
          status: 'processing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        outcomes.push(outcome)
        void (async () => {
          await wait(400)
          outcome.status = 'done'
          sim.status = 'completed'
          sim.completedCount = 1
          sim.updatedAt = new Date().toISOString()
          reports[outcome.id] = mockParsed(31, 'Mock path completed after create.')
          simProgress.emit({
            simId: sim.id,
            outcomeId: outcome.id,
            status: 'done',
            completedCount: 1,
            outcomeCount: 1,
          })
        })()
        return sim
      },
      delete: async (_profileSlug, simId) => {
        const i = simulations.findIndex((s) => s.id === simId)
        if (i >= 0) simulations.splice(i, 1)
        return { success: true }
      },
      requeue: async (_profileSlug, simId, outcomeId) => {
        const targets = outcomes.filter((o) => o.simId === simId && (!outcomeId || o.id === outcomeId))
        for (const o of targets) {
          o.status = 'processing'
          o.error = undefined
        }
        const sim = simulations.find((s) => s.id === simId)
        if (sim) {
          sim.status = 'processing'
          sim.errorCount = 0
        }
        void (async () => {
          await wait(500)
          for (const o of targets) {
            o.status = 'done'
            reports[o.id] = reports[o.id] ?? mockParsed(40, 'Requeued mock outcome.')
            simProgress.emit({
              simId,
              outcomeId: o.id,
              status: 'done',
              completedCount: targets.length,
              outcomeCount: outcomes.filter((x) => x.simId === simId).length,
            })
          }
          if (sim) {
            sim.status = 'completed'
            sim.completedCount = outcomes.filter((x) => x.simId === simId && x.status === 'done').length
            sim.updatedAt = new Date().toISOString()
          }
        })()
        return { success: true, requeued: targets.length }
      },
      getOutcome: async (_p, _s, outcomeId) => outcomes.find((o) => o.id === outcomeId) ?? null,
      listOutcomes: async (_p, simId) => outcomes.filter((o) => o.simId === simId),
      getReport: async (_p, simId) => buildReport(simId),
      translateReport: async (_p, simId, targetLang) => {
        const report = buildReport(simId)
        const tag = `[${targetLang}] `
        return {
          ...report,
          reports: Object.fromEntries(
            Object.entries(report.reports).map(([id, r]) => [
              id,
              r
                ? {
                    ...r,
                    summary: tag + r.summary,
                    recommendations: r.recommendations.map((x) => tag + x),
                    keyDrivers: r.keyDrivers.map((x) => tag + x),
                    uncertainty: tag + r.uncertainty,
                  }
                : null,
            ]),
          ),
        }
      },
      setModalOpen: async () => undefined,
      exportReport: async (_p, simId, format) => ({
        ok: true,
        path: `/mock/exports/${simId}.${format}`,
      }),
      onProgress: (cb) => simProgress.on(cb),
    },
    datasets: {
      list: async () => [...datasets],
      get: async (id) => datasets.find((d) => d.id === id) ?? null,
      create: async (entry) => {
        const created: DatasetEntry = {
          id: `ds-${Date.now()}`,
          name: entry.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sources: entry.sources,
          sampleCount: 12,
          trainJsonlPath: '/mock/datasets/new.jsonl',
          trainTxtPath: null,
        }
        datasets.unshift(created)
        return created
      },
      update: async (id, patch) => {
        const ds = datasets.find((d) => d.id === id)
        if (!ds) return null
        Object.assign(ds, patch, { updatedAt: new Date().toISOString() })
        return ds
      },
      delete: async (id) => {
        const i = datasets.findIndex((d) => d.id === id)
        if (i >= 0) datasets.splice(i, 1)
        return { success: true }
      },
      importJsonl: async () => '/Users/demo/data/imported.jsonl',
    },
    trainings: {
      list: async () => [...trainings],
      get: async (id) => trainings.find((t) => t.id === id) ?? null,
      start: async (payload) => {
        const run: TrainingRun = {
          id: `run-${Date.now()}`,
          name: payload.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          datasetId: payload.datasetId,
          baseModelId: payload.baseModelId,
          options: payload.options as TrainingRunOptions,
          status: 'running',
          progress: { epoch: 1, step: 0, totalSteps: 40, loss: 1.2, eta: 40 },
          outputLoraPath: null,
          loraId: null,
          error: null,
        }
        trainings.unshift(run)
        trainingActive = true
        void (async () => {
          for (let step = 1; step <= 40; step += 8) {
            await wait(200)
            run.progress = {
              epoch: step > 20 ? 2 : 1,
              step,
              totalSteps: 40,
              loss: Math.max(0.3, 1.2 - step / 40),
              eta: 40 - step,
            }
            trainingProgress.emit({ runId: run.id, ...run.progress })
          }
          run.status = 'done'
          run.outputLoraPath = `/mock/loras/${run.id}`
          const lora: LoraEntry = {
            id: `lora-${Date.now()}`,
            name: `${payload.name} adapter`,
            baseModelId: payload.baseModelId,
            loraPath: run.outputLoraPath,
            source: 'training',
            trainingRunId: run.id,
            createdAt: new Date().toISOString(),
          }
          loras.unshift(lora)
          run.loraId = lora.id
          trainingActive = false
          trainingProgress.emit({ runId: run.id, ...run.progress })
        })()
        return run
      },
      pause: async (id) => {
        const run = trainings.find((t) => t.id === id)
        if (run) run.status = 'paused'
        return { success: true }
      },
      resume: async (id) => {
        const run = trainings.find((t) => t.id === id)
        if (run) run.status = 'running'
        return { success: true }
      },
      cancelRun: async (id) => {
        const run = trainings.find((t) => t.id === id)
        if (run) run.status = 'canceled'
        trainingActive = false
        return { success: true }
      },
      delete: async (id) => {
        const i = trainings.findIndex((t) => t.id === id)
        if (i >= 0) trainings.splice(i, 1)
        return { success: true }
      },
      onProgress: (cb) => trainingProgress.on(cb),
    },
    loras: {
      list: async () => [...loras],
      get: async (id) => loras.find((l) => l.id === id) ?? null,
      delete: async (id) => {
        const i = loras.findIndex((l) => l.id === id)
        const removed = i >= 0 ? loras.splice(i, 1)[0] : undefined
        if (activeLoraId === id) activeLoraId = null
        return { success: true, removed }
      },
      import: async () => {
        const lora: LoraEntry = {
          id: `lora-import-${Date.now()}`,
          name: 'Imported adapter',
          baseModelId: builtinModel.id,
          loraPath: '/Users/demo/loras/imported',
          source: 'imported',
          trainingRunId: null,
          createdAt: new Date().toISOString(),
        }
        loras.unshift(lora)
        return lora
      },
    },
    p2p: {
      status: async () => structuredClone(p2pStatus),
      providerStart: async () => {
        p2pStatus.provider.running = true
        p2pStatus.provider.starting = false
        p2pHub.emit(structuredClone(p2pStatus))
        return { success: true, publicKey: p2pStatus.provider.publicKey ?? undefined }
      },
      providerStop: async () => {
        p2pStatus.provider.running = false
        p2pHub.emit(structuredClone(p2pStatus))
        return { success: true }
      },
      providerSetEnabled: async (enabled) => {
        p2pStatus.provider.enabled = enabled
        p2pHub.emit(structuredClone(p2pStatus))
        return { success: true }
      },
      consumerSetEnabled: async (enabled) => {
        p2pStatus.consumer.enabled = enabled
        p2pHub.emit(structuredClone(p2pStatus))
        return { success: true }
      },
      peersList: async () => ({ peers: [...peers] }),
      peersAdd: async (input) => {
        const peer: P2PPeer = {
          id: `peer-${Date.now()}`,
          name: input.name,
          publicKey: input.publicKey,
          createdAt: new Date().toISOString(),
        }
        peers.push(peer)
        p2pStatus.consumer.peers = [...peers]
        p2pHub.emit(structuredClone(p2pStatus))
        return { success: true, peer }
      },
      peersRemove: async (id) => {
        const i = peers.findIndex((p) => p.id === id)
        if (i >= 0) peers.splice(i, 1)
        p2pStatus.consumer.peers = [...peers]
        p2pHub.emit(structuredClone(p2pStatus))
        return { success: true }
      },
      peersConnect: async (id) => {
        const peer = peers.find((p) => p.id === id) ?? null
        p2pStatus.consumer.activePeerId = id
        p2pStatus.consumer.activePeer = peer
        p2pStatus.consumer.delegatedTo = peer
          ? { publicKey: peer.publicKey, peerName: peer.name }
          : null
        p2pHub.emit(structuredClone(p2pStatus))
        return { success: true }
      },
      peersDisconnect: async () => {
        p2pStatus.consumer.activePeerId = null
        p2pStatus.consumer.activePeer = null
        p2pStatus.consumer.delegatedTo = null
        p2pHub.emit(structuredClone(p2pStatus))
        return { success: true }
      },
      onStatus: (cb) => p2pHub.on(cb),
    },
    translation: {
      supportedLanguages: async () => langs,
      status: async () => ({ ...translation }),
      load: async (lang) => {
        translation = {
          loaded: true,
          targetLang: lang,
          targetLabel: langs.find((l) => l.code === lang)?.label ?? lang,
          loading: false,
          error: null,
        }
        return { success: true, modelId: `bergamot-${lang}` }
      },
      unload: async () => {
        translation = {
          loaded: false,
          targetLang: null,
          targetLabel: null,
          loading: false,
          error: null,
        }
        return { success: true }
      },
    },
  }

  return api
}

export function installMockApi(): void {
  if (typeof window === 'undefined') return
  if ((window as Window & { __MOCK_API__?: boolean }).__MOCK_API__) return
  try {
    window.api = createMockApi()
  } catch {
    // contextBridge may freeze window.api; preload mock still applies.
  }
  ;(window as Window & { __MOCK_API__?: boolean }).__MOCK_API__ = true
}
