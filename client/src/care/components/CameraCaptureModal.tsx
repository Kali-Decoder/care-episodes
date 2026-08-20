'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import MonoButton from '../../renderer/src/components/ui/MonoButton'
import { MUTED, NAVY, TEAL, monoFont, sansFont } from '../ui'

export default function CameraCaptureModal({
  open,
  onClose,
  onCapture,
  title = 'Take a photo',
  hint = 'Hold steady in good light. Fill the frame with the document.',
}: {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
  title?: string
  hint?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setReady(false)
  }, [])

  useEffect(() => {
    if (!open) {
      stopCamera()
      setError(null)
      return
    }

    let cancelled = false

    async function start() {
      setError(null)
      setReady(false)
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not supported in this browser.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setReady(true)
      } catch {
        setError('Could not access the camera. Check permissions or use file upload instead.')
      }
    }

    void start()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [open, stopCamera])

  const capture = () => {
    const video = videoRef.current
    if (!video || !ready) return
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
        stopCamera()
        onCapture(file)
        onClose()
      },
      'image/jpeg',
      0.92,
    )
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,92,0.45)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={() => {
        stopCamera()
        onClose()
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          maxWidth: 520,
          width: '100%',
          padding: 24,
          border: '1px solid #e0e0f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: 3, background: TEAL, borderRadius: 4, margin: '-24px -24px 16px' }} />
        <p style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', margin: '0 0 6px' }}>
          Camera
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: NAVY, margin: '0 0 8px', fontFamily: sansFont }}>{title}</h2>
        <p style={{ fontSize: 13, color: '#4a4a78', margin: '0 0 16px', lineHeight: 1.5 }}>{hint}</p>

        <div
          style={{
            position: 'relative',
            background: '#0a0a5c',
            borderRadius: 8,
            overflow: 'hidden',
            aspectRatio: '4/3',
            marginBottom: 16,
          }}
        >
          {error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#fff', margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {ready && (
            <div
              style={{
                position: 'absolute',
                inset: 12,
                border: '2px dashed rgba(255,255,255,0.35)',
                borderRadius: 6,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <MonoButton
            onClick={() => {
              stopCamera()
              onClose()
            }}
          >
            Cancel
          </MonoButton>
          <MonoButton onClick={capture} variant="primary" disabled={!ready || !!error}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Camera size={14} strokeWidth={2} aria-hidden />
              Capture photo →
            </span>
          </MonoButton>
        </div>
      </div>
    </div>
  )
}
