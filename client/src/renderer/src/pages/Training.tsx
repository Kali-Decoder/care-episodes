import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAI } from '../context/AIContext'
import { useProfile } from '../context/ProfileContext'
import { useTraining } from '../context/TrainingContext'
import PageWrapper from '../components/PageWrapper'
import PasteDataModal from '../components/PasteDataModal'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'
import type {
  DatasetEntry,
  LoraEntry,
  TrainingRun,
  TrainingRunOptions,
  TrainingRunProgress,
} from '../../../preload/index.d'

/**
 * Training page — collects simulation outcomes and custom data into SFT
 * datasets, kicks off `finetune()` runs against the loaded base model, and
 * tracks the resulting LoRA adapters. Model / LoRA selection happens at
 * the Model Selector — this page only reads `useAI().activeModel` and the
 * `activeLora` to know which base model is bound to the run.
 */
export default function Training() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { profile } = useProfile()
  const { status, activeModel, activeLora, trainingActive } = useAI()
  const { datasets, trainings, loras, progress, refreshDatasets, refreshLoras, refreshTrainings } =
    useTraining()

  const [sims, setSims] = useState<Array<{ id: string; name: string; outcomeCount: number }>>([])
  const [selectedSimIds, setSelectedSimIds] = useState<Set<string>>(new Set())
  const [customData, setCustomData] = useState<DatasetEntry['sources']['customData']>([])
  const [datasetName, setDatasetName] = useState('')
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [pasteModal, setPasteModal] = useState<null | {
    kind: 'jsonl-text' | 'text'
    presetLabel?: string
  }>(null)
  const [pendingFilePath, setPendingFilePath] = useState<string | null>(null)

  const showToast = (kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), 3000)
  }

  // Load completed sims for the Sources section.
  useEffect(() => {
    if (!profile) return
    void (async () => {
      try {
        const list = await window.api.simulations.list(profile.id)
        setSims(
          list
            .filter((s) => (s.completedCount ?? 0) > 0 || s.status === 'completed')
            .map((s) => ({ id: s.id, name: s.name, outcomeCount: s.completedCount ?? 0 })),
        )
      } catch (e) {
        console.error('[Training] sim list failed:', e)
      }
    })()
  }, [profile])

  // Pre-check simIds from query string (set by RecentSimulations multi-select).
  useEffect(() => {
    const csv = params.get('simIds')
    if (!csv) return
    const ids = csv.split(',').filter(Boolean)
    if (ids.length > 0) setSelectedSimIds(new Set(ids))
  }, [params])

  const currentLoraId = activeLora?.id ?? null

  const toggleSim = (id: string) => {
    setSelectedSimIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddJsonlText = () => {
    setPasteModal({ kind: 'jsonl-text' })
  }

  const handleAddText = () => {
    setPasteModal({ kind: 'text' })
  }

  const handleImportJsonlFile = async () => {
    const picked = await window.api.datasets.importJsonl()
    if (!picked) return
    // Derive a default label from the file name (no extension).
    const fileName = picked.split(/[\\/]/).pop() ?? 'imported'
    const defaultLabel = fileName.replace(/\.[^.]+$/, '')
    setPasteModal({ kind: 'jsonl-text', presetLabel: defaultLabel })
    setPendingFilePath(picked)
  }

  const handlePasteSubmit = ({ label, text }: { label: string; text: string }) => {
    if (!pasteModal) return
    if (pendingFilePath) {
      // The user opened this modal from "Import JSONL file" — register a
      // jsonl-file entry that points at the file on disk, not a pasted
      // blob. The text the user typed/pasted is ignored for the file
      // path source, but we still respect "Add" for label confirmation.
      setCustomData((prev) => [...prev, { kind: 'jsonl-file', label, path: pendingFilePath }])
      setPendingFilePath(null)
    } else {
      setCustomData((prev) => [...prev, { kind: pasteModal.kind, label, text }])
    }
    setPasteModal(null)
  }

  const handlePasteCancel = () => {
    setPasteModal(null)
    setPendingFilePath(null)
  }

  const handleRemoveCustom = (idx: number) => {
    setCustomData((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSaveDataset = async () => {
    if (!profile) return
    if (selectedSimIds.size === 0 && customData.length === 0) {
      showToast('err', 'Pick at least one simulation or add custom data first.')
      return
    }
    const name = datasetName.trim() || `Dataset · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
    try {
      const created = await window.api.datasets.create({
        name,
        sources: { simulationIds: Array.from(selectedSimIds), customData },
        profileSlug: profile.id,
      })
      showToast('ok', `Saved "${created.name}" (${created.sampleCount} samples)`)
      setDatasetName('')
      setSelectedSimIds(new Set())
      setCustomData([])
      await refreshDatasets()
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'Failed to save dataset')
    }
  }

  const handleDeleteDataset = async (id: string) => {
    if (!window.confirm('Delete this dataset? The JSONL on disk will be unlinked.')) return
    await window.api.datasets.delete(id)
    await refreshDatasets()
  }

  const handleStartTraining = async (dataset: DatasetEntry) => {
    if (!activeModel) {
      showToast('err', 'No base model is loaded. Pick one from the chat input first.')
      return
    }
    if (trainingActive) {
      showToast('err', 'A training run is already in progress.')
      return
    }
    try {
      const options: TrainingRunOptions = {
        numberOfEpochs: 3,
        learningRate: 2e-4,
        loraRank: 16,
        loraAlpha: 32,
        contextLength: 2048,
        batchSize: 4,
        microBatchSize: 1,
        assistantLossOnly: true,
      }
      await window.api.trainings.start({
        name: `${dataset.name} · ${new Date().toISOString().slice(0, 10)}`,
        datasetId: dataset.id,
        baseModelId: activeModel.id,
        options,
      })
      showToast('ok', 'Training started')
      await refreshTrainings()
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'Failed to start training')
    }
  }

  const handlePause = async (id: string) => {
    await window.api.trainings.pause(id)
    await refreshTrainings()
  }
  const handleResume = async (id: string) => {
    await window.api.trainings.resume(id)
    await refreshTrainings()
  }
  const handleCancel = async (id: string) => {
    await window.api.trainings.cancelRun(id)
    await refreshTrainings()
  }
  const handleDeleteRun = async (id: string) => {
    if (!window.confirm('Delete this training run record? The LoRA on disk (if any) will NOT be deleted.')) return
    await window.api.trainings.delete(id)
    await refreshTrainings()
  }

  const handleDeleteLora = async (lora: LoraEntry) => {
    if (currentLoraId === lora.id) {
      showToast('err', 'This LoRA is currently active. Set the chat input LoRA picker to "None" (or to another LoRA) to free it up.')
      return
    }
    if (!window.confirm(`Delete LoRA "${lora.name}"? The .gguf file on disk will be unlinked.`)) return
    try {
      const r = await window.api.loras.delete(lora.id)
      if (!r.success) {
        showToast('err', 'Failed to delete')
        return
      }
      await refreshLoras()
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  return (
    <PageWrapper
      title="Training"
      category="Account"
    >
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: toast.kind === 'ok' ? TEAL : '#cc0000',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 6,
            fontFamily: monoFont,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            zIndex: 200,
          }}
        >
          {toast.msg}
        </div>
      )}

      <PasteDataModal
        open={pasteModal !== null}
        kind={pasteModal?.kind ?? 'text'}
        presetLabel={pasteModal?.presetLabel}
        onCancel={handlePasteCancel}
        onSubmit={handlePasteSubmit}
      />

      {/* Section 1 — Sources */}
      <Section title="1. Sources" hint="Pick completed simulations and add custom data to include in a new dataset.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SubSection label="Completed simulations">
            {sims.length === 0 ? (
              <Empty msg="No completed simulations yet. Build a scenario to get started." />
            ) : (
              <Table headers={['Pick', 'Name', 'Outcomes']}>
                {sims.map((s) => (
                  <tr key={s.id}>
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={selectedSimIds.has(s.id)}
                        onChange={() => toggleSim(s.id)}
                      />
                    </td>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={tdStyle}>{s.outcomeCount}</td>
                  </tr>
                ))}
              </Table>
            )}
          </SubSection>

          <SubSection label="Custom training data">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <SmallButton onClick={handleAddJsonlText}>+ Paste JSONL</SmallButton>
              <SmallButton onClick={handleAddText}>+ Paste text</SmallButton>
              <SmallButton onClick={handleImportJsonlFile}>+ Import JSONL file</SmallButton>
            </div>
            {customData.length === 0 ? (
              <p style={emptyHintStyle}>No custom data added.</p>
            ) : (
              <Table headers={['Label', 'Kind', 'Source']}>
                {customData.map((c, i) => (
                  <tr key={i}>
                    <td style={tdStyle}>{c.label}</td>
                    <td style={tdStyle}>{c.kind}</td>
                    <td style={tdStyle}>
                      {c.kind === 'jsonl-text' || c.kind === 'text'
                        ? `${(c.text ?? '').length} chars`
                        : c.path}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button onClick={() => handleRemoveCustom(i)} style={linkBtnStyle}>
                        remove
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </SubSection>

          <SubSection label="Save as dataset">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="Dataset name (optional)"
                style={inputStyle}
              />
              <SmallButton onClick={handleSaveDataset} primary>
                Save current selection
              </SmallButton>
            </div>
            <p style={emptyHintStyle}>
              {selectedSimIds.size} sim(s) · {customData.length} custom data source(s)
            </p>
          </SubSection>
        </div>
      </Section>

      {/* Section 2 — Datasets */}
      <Section title="2. Datasets">
        {datasets.length === 0 ? (
          <Empty msg="No datasets saved yet. Use Section 1 to create one." />
        ) : (
          <Table headers={['Name', 'Samples', 'Created', '']}>
            {datasets.map((d) => (
              <tr key={d.id}>
                <td style={tdStyle}>{d.name}</td>
                <td style={tdStyle}>{d.sampleCount}</td>
                <td style={tdStyle}>{new Date(d.createdAt).toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <button
                    onClick={() => handleStartTraining(d)}
                    style={{ ...linkBtnStyle, color: BLUE, fontWeight: 700 }}
                    disabled={!activeModel || trainingActive}
                    title={!activeModel ? 'Load a base model first' : trainingActive ? 'A run is in progress' : 'Start training'}
                  >
                    Start training
                  </button>
                  <button onClick={() => handleDeleteDataset(d.id)} style={{ ...linkBtnStyle, marginLeft: 12 }}>
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      {/* Section 3 — Training runs */}
      <Section title="3. Training runs">
        {trainings.length === 0 ? (
          <Empty msg="No training runs yet. Pick a dataset and click Start training above." />
        ) : (
          <Table headers={['Name', 'Status', 'Progress', 'LoRA', '']}>
            {trainings
              .slice()
              .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
              .map((run) => (
                <TrainingRunRow
                  key={run.id}
                  run={run}
                  tick={progress[run.id] ?? null}
                  onPause={handlePause}
                  onResume={handleResume}
                  onCancel={handleCancel}
                  onDelete={handleDeleteRun}
                  onOpenChat={() => navigate('/chat')}
                />
              ))}
          </Table>
        )}
      </Section>

      {/* Section 4 — Fine-tuned models */}
      <Section
        title="4. Fine-tuned models"
        hint="Use the chat input (left of the message field) to bind a fine-tuned model for chat. The active one cannot be deleted here. Import .gguf files from the chat input picker too."
      >
        {loras.length === 0 ? (
          <Empty msg="No fine-tuned models yet. Train one above, or import a .gguf from the chat input." />
        ) : (
          <Table headers={['Name', 'Parent model', 'How added', 'Created', 'Size', '']}>
            {loras.map((l) => {
              const base = status?.available?.find((m) => m.id === l.baseModelId)
              const isActive = currentLoraId === l.id
              return (
                <tr key={l.id} style={isActive ? { background: '#f0fafa' } : undefined}>
                  <td style={tdStyle}>
                    {l.name}
                    {isActive && (
                      <span style={activeBadgeStyle}>ACTIVE</span>
                    )}
                  </td>
                  <td style={tdStyle}>{base?.name ?? l.baseModelId}</td>
                  <td style={tdStyle}>{l.source === 'training' ? 'Trained' : 'Imported'}</td>
                  <td style={tdStyle}>{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td style={tdStyle}>{l.sizeBytes ? formatBytes(l.sizeBytes) : '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteLora(l)}
                      style={isActive ? disabledLinkBtnStyle : linkBtnStyle}
                      disabled={isActive}
                      title={
                        isActive
                          ? 'Cannot delete — this LoRA is currently active. Set the chat input LoRA picker to "None" (or to another LoRA) to free it up.'
                          : 'Delete LoRA'
                      }
                    >
                      delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </Section>
    </PageWrapper>
  )
}

// ─── sub-components ─────────────────────────────────────────────────────

function Section({
  title,
  hint,
  buttons,
  children,
}: {
  title: string
  hint?: string
  buttons?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e0e0f0',
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: sansFont,
              fontSize: 16,
              fontWeight: 500,
              color: NAVY,
              margin: 0,
            }}
          >
            {title}
          </h2>
          {hint && (
            <p style={{ ...emptyHintStyle, marginTop: 4 }}>{hint}</p>
          )}
        </div>
        {buttons}
      </div>
      {children}
    </div>
  )
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          color: MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          margin: '0 0 8px 0',
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e0e0f0', borderRadius: 6, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sansFont, fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f7f7fc' }}>
            {headers.map((h) => (
              <th key={h} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return <p style={{ ...emptyHintStyle, textAlign: 'center', padding: '16px 0' }}>{msg}</p>
}

function SmallButton({
  onClick,
  children,
  primary,
  disabled,
  title,
}: {
  onClick: () => void
  children: React.ReactNode
  primary?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '6px 12px',
        background: primary ? TEAL : '#fff',
        color: primary ? '#fff' : NAVY,
        border: primary ? `1px solid ${TEAL}` : '1px solid #e0e0f0',
        borderRadius: 4,
        fontFamily: monoFont,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

function TrainingRunRow({
  run,
  tick,
  onPause,
  onResume,
  onCancel,
  onDelete,
  onOpenChat,
}: {
  run: TrainingRun
  tick: TrainingRunProgress | null
  onPause: (id: string) => void
  onResume: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  onOpenChat: () => void
}) {
  const liveProgress = tick ?? run.progress
  const isActive = run.status === 'running'
  const isPaused = run.status === 'paused'
  return (
    <>
      <tr>
        <td style={tdStyle}>{run.name}</td>
        <td style={tdStyle}>
          <StatusChip status={run.status} />
        </td>
        <td style={{ ...tdStyle, minWidth: 200 }}>
          {run.status === 'running' || run.status === 'paused' ? (
            <ProgressBar
              epoch={liveProgress.epoch}
              totalEpochs={run.options.numberOfEpochs}
              step={liveProgress.step}
              totalSteps={liveProgress.totalSteps}
              loss={liveProgress.loss}
              eta={liveProgress.eta}
            />
          ) : run.status === 'done' ? (
            <span style={{ color: TEAL, fontFamily: monoFont, fontSize: 11 }}>✓ done</span>
          ) : run.status === 'failed' ? (
            <span style={{ color: '#cc0000', fontFamily: monoFont, fontSize: 11 }}>{run.error ?? 'failed'}</span>
          ) : run.status === 'canceled' ? (
            <span style={{ color: MUTED, fontFamily: monoFont, fontSize: 11 }}>canceled</span>
          ) : (
            <span style={emptyHintStyle}>—</span>
          )}
        </td>
        <td style={tdStyle}>
          {run.status === 'done' && run.loraId ? (
            <span style={emptyHintStyle}>LoRA registered</span>
          ) : (
            <span style={emptyHintStyle}>—</span>
          )}
        </td>
        <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
          {isActive && <button onClick={() => onPause(run.id)} style={linkBtnStyle}>pause</button>}
          {isPaused && <button onClick={() => onResume(run.id)} style={linkBtnStyle}>resume</button>}
          {(isActive || isPaused) && (
            <button onClick={() => onCancel(run.id)} style={{ ...linkBtnStyle, marginLeft: 8 }}>
              cancel
            </button>
          )}
          {run.status !== 'running' && run.status !== 'paused' && (
            <button onClick={() => onDelete(run.id)} style={{ ...linkBtnStyle, marginLeft: 8 }}>
              delete
            </button>
          )}
        </td>
      </tr>
      {run.status === 'done' && run.loraId && (
        <tr>
          <td colSpan={5} style={{ padding: '8px 12px', background: '#f0fafa', borderTop: '1px solid #d0eee5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontFamily: sansFont,
                  fontSize: 13,
                  color: '#085041',
                }}
              >
                ✓ Training complete. The new LoRA is now available — bind it from
                the <strong>chat input</strong> to use it in chat.
              </span>
              <button
                onClick={onOpenChat}
                style={{
                  padding: '4px 10px',
                  background: TEAL,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontFamily: monoFont,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Open Chat
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function StatusChip({ status }: { status: TrainingRun['status'] }) {
  const color =
    status === 'done'
      ? TEAL
      : status === 'running'
      ? BLUE
      : status === 'paused'
      ? '#aa8800'
      : status === 'failed'
      ? '#cc0000'
      : status === 'canceled'
      ? MUTED
      : MUTED
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        background: color,
        color: '#fff',
        borderRadius: 3,
        fontFamily: monoFont,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  )
}

function ProgressBar({
  epoch,
  totalEpochs,
  step,
  totalSteps,
  loss,
  eta,
}: {
  epoch: number
  totalEpochs: number
  step: number
  totalSteps: number
  loss: number | null
  eta: number | null
}) {
  const stepPct = totalSteps > 0 ? Math.min(100, Math.max(0, (step / totalSteps) * 100)) : 0
  const epochPct = totalEpochs > 0 ? Math.min(100, Math.max(0, (epoch / totalEpochs) * 100)) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          height: 4,
          background: '#e0e0f0',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${epochPct}%`,
            background: TEAL,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: monoFont,
          fontSize: 9,
          color: MUTED,
          letterSpacing: '0.08em',
        }}
      >
        <span>
          EPOCH {epoch}/{totalEpochs}
        </span>
        <span>
          STEP {step}
          {totalSteps > 0 ? `/${totalSteps} · ${stepPct.toFixed(0)}%` : ''}
        </span>
        <span>
          {loss !== null ? `LOSS ${loss.toFixed(3)}` : ''}
          {eta !== null && eta > 0 ? ` · ETA ${formatEta(eta)}` : ''}
        </span>
      </div>
    </div>
  )
}

// ─── shared styles ──────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontFamily: monoFont,
  fontSize: 10,
  letterSpacing: '0.12em',
  color: MUTED,
  textTransform: 'uppercase',
  fontWeight: 700,
  borderBottom: '1px solid #e0e0f0',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderTop: '1px solid #e0e0f0',
  verticalAlign: 'middle',
}

const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: BLUE,
  fontFamily: monoFont,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: 0,
}

const disabledLinkBtnStyle: React.CSSProperties = {
  ...linkBtnStyle,
  color: MUTED,
  cursor: 'not-allowed',
  opacity: 0.5,
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #e0e0f0',
  borderRadius: 4,
  fontFamily: sansFont,
  fontSize: 13,
  minWidth: 240,
}

const emptyHintStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: 11,
  color: MUTED,
  margin: '8px 0 0 0',
  letterSpacing: '0.04em',
}

const activeBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  marginLeft: 8,
  padding: '1px 6px',
  border: `1px solid ${TEAL}`,
  color: TEAL,
  borderRadius: 3,
  fontFamily: monoFont,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatEta(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m${s % 60 ? ` ${s % 60}s` : ''}`
  const h = Math.floor(m / 60)
  return `${h}h${m % 60 ? ` ${m % 60}m` : ''}`
}
