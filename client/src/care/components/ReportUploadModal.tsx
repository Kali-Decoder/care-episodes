'use client'

import { useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import MonoButton from '../../renderer/src/components/ui/MonoButton'
import CameraCaptureModal from './CameraCaptureModal'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../ui'

export default function ReportUploadModal({
  open,
  onClose,
  onSubmit,
  uploading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (file: File) => void
  uploading?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const setSelected = (f: File) => {
    setFile(f)
    if (f.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(f))
    else setPreviewUrl(null)
  }

  const handleClose = () => {
    setFile(null)
    setPreviewUrl(null)
    setCameraOpen(false)
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10,10,92,0.35)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
        onClick={handleClose}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            maxWidth: 440,
            width: '100%',
            padding: 28,
            border: '1px solid #E8E2D6',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ height: 3, background: TEAL, borderRadius: '4px 4px 0 0', margin: '-28px -28px 20px' }} />
          <p style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', margin: '0 0 8px' }}>
            Upload lab report
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: NAVY, margin: '0 0 8px', fontFamily: sansFont }}>
            Add your results
          </h2>
          <p style={{ fontSize: 14, color: '#6B6560', margin: '0 0 16px', lineHeight: 1.5 }}>
            PDF or image from your lab — or photograph the printed report with your camera.
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
              padding: previewUrl ? 12 : '32px 16px',
              border: `2px dashed ${file ? BLUE : '#E8E2D6'}`,
              borderRadius: 8,
              background: '#fafafe',
              cursor: 'pointer',
              fontFamily: sansFont,
              color: NAVY,
              marginBottom: 16,
            }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            ) : (
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Upload size={28} color={MUTED} strokeWidth={1.5} aria-hidden />
                <span>{file?.name ?? 'Choose file or use camera'}</span>
              </span>
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setSelected(f)
            }}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <MonoButton onClick={handleClose}>Cancel</MonoButton>
            <MonoButton onClick={() => file && onSubmit(file)} variant="primary" disabled={!file || uploading}>
              {uploading ? 'Uploading…' : 'Submit report'}
            </MonoButton>
          </div>
        </div>
      </div>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={setSelected}
        title="Photograph your lab report"
        hint="Capture all pages clearly. Numbers and reference ranges should be readable."
      />
    </>
  )
}
