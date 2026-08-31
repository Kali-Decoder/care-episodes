'use client'

import { useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import MonoButton from '../../renderer/src/components/ui/MonoButton'
import CareLoader from './CareLoader'
import CameraCaptureModal from './CameraCaptureModal'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, monoFont } from '../ui'

export default function PrescriptionUpload({
  onUpload,
  uploading,
  usingDeviceLocation,
  embedded = false,
}: {
  onUpload: (file: File) => void
  uploading?: boolean
  /** Shown while uploading when device coords were obtained for lab search. */
  usingDeviceLocation?: boolean
  /** When true, renders inner controls only — section chrome lives on the dashboard. */
  embedded?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ name: string; url?: string } | null>(null)

  const setFile = (file: File) => {
    setSelectedFile(file)
    setPreview({
      name: file.name,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    })
  }

  const submit = () => {
    if (selectedFile) onUpload(selectedFile)
  }

  const body = (
    <>
      <p style={{ fontSize: 14, color: '#4a4a78', margin: embedded ? '0 0 16px' : '0 0 16px', lineHeight: 1.55 }}>
        Photo or PDF from your doctor — or snap one with your camera. NaniAi reads it to start the episode.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <MonoButton onClick={() => inputRef.current?.click()}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Upload size={14} strokeWidth={2} aria-hidden />
            Browse file
          </span>
        </MonoButton>
        <MonoButton onClick={() => setCameraOpen(true)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Camera size={14} strokeWidth={2} aria-hidden />
            Take photo
          </span>
        </MonoButton>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%',
          minHeight: 140,
          border: `1px dashed ${preview ? BLUE : dragging ? BLUE : '#d0d0e8'}`,
          borderRadius: 8,
          background: LIGHT_BLUE,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {preview?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.url} alt="" style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <>
            <Upload size={32} color={MUTED} strokeWidth={1.5} aria-hidden />
            <span style={{ fontFamily: monoFont, fontSize: 11, color: MUTED, letterSpacing: '0.08em', textAlign: 'center', padding: '0 16px' }}>
              {preview?.name ?? 'Drop file here, or use browse / camera above'}
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setFile(f)
        }}
      />

      <MonoButton onClick={submit} variant="primary" disabled={!selectedFile || uploading}>
        {uploading ? 'Creating episode…' : 'Upload episode →'}
      </MonoButton>
      {uploading && (
        <div style={{ marginTop: 12 }}>
          {usingDeviceLocation && (
            <p style={{ fontSize: 12, color: MUTED, margin: '0 0 8px' }}>📍 Using your location for nearby labs</p>
          )}
          <CareLoader variant="inline" label="Intake agent starting…" />
        </div>
      )}

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={setFile}
        title="Photograph your prescription"
        hint="Lay the prescription flat. Avoid glare and keep all text inside the frame."
      />
    </>
  )

  if (embedded) {
    return (
      <div
        style={{ padding: '20px 24px 24px' }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) setFile(f)
        }}
      >
        {body}
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#fff',
        border: dragging ? `2px solid ${BLUE}` : '1px solid #e0e0f0',
        borderRadius: 8,
        padding: 28,
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) setFile(f)
      }}
    >
      <p style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', margin: '0 0 8px' }}>
        Start an episode
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: NAVY, margin: '0 0 8px' }}>
        Upload your prescription
      </h2>
      {body}
    </div>
  )
}
