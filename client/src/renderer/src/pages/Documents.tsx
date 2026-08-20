import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useProfile } from '../context/ProfileContext'
import { BLUE, TEAL, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont } from '../theme'
import SectionLabel from '../components/ui/SectionLabel'

interface DocumentItem {
  id: string
  type: 'text' | 'ocr' | 'note'
  name: string
  content: string
  metadata: {
    originalName?: string
    mimeType?: string
    size?: number
  }
  createdAt: string
  updatedAt: string
}

function DropZone({ onFileAdd, isProcessing }: { onFileAdd: (content: string, name: string, type: 'text' | 'ocr' | 'note') => void; isProcessing: boolean }) {
  const [isDragging, setIsDragging] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteName, setNoteName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    // Use files array which has the path property in Electron
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      await processFile(file)
    }
  }

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      await processFile(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const processFile = async (file: File) => {
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      // Read text files directly
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        onFileAdd(content, file.name, 'text')
      }
      reader.readAsText(file)
    } else if (file.type.startsWith('image/')) {
      // For images, we need to send the actual file path
      // In Electron, file objects have a 'path' property with full path
      const filePath = (file as any).path
      
      if (!filePath) {
        console.error('[Documents] No file path available')
        onFileAdd(`[Image: ${file.name}] - Could not get file path`, file.name, 'ocr')
        return
      }
      
      console.log('[Documents] Processing image with OCR:', filePath)
      
      try {
        const result = await window.api.documents.processOcr(filePath)
        if (result.success && result.text) {
          onFileAdd(result.text, file.name, 'ocr')
        } else {
          console.error('[Documents] OCR failed:', result.error)
          onFileAdd(`[Image: ${file.name}] - OCR failed`, file.name, 'ocr')
        }
      } catch (error) {
        console.error('[Documents] OCR error:', error)
        onFileAdd(`[Image: ${file.name}] - OCR error`, file.name, 'ocr')
      }
    } else {
      // Try to read as text
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        onFileAdd(content.substring(0, 5000), file.name, 'text')
      }
      reader.readAsText(file)
    }
  }

  const handleAddNote = () => {
    if (noteContent.trim() && noteName.trim()) {
      onFileAdd(noteContent, noteName, 'note')
      setNoteContent('')
      setNoteName('')
      setShowInput(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.txt,.pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: `2px dashed ${isDragging ? BLUE : '#e0e0f0'}`,
          borderRadius: 8,
          padding: '48px 32px',
          textAlign: 'center',
          background: isDragging ? '#f0f0fd' : '#fff',
          transition: 'all 0.2s',
          cursor: isProcessing ? 'wait' : 'pointer',
          opacity: isProcessing ? 0.7 : 1,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: LIGHT_BLUE,
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <span style={{ fontFamily: monoFont, fontSize: 20, color: MUTED }}>⟳</span>
            </motion.div>
          ) : (
            <span style={{ fontFamily: monoFont, fontSize: 20, color: TEAL }}>+</span>
          )}
        </div>
        <p style={{ fontFamily: sansFont, fontSize: 14, color: NAVY, marginBottom: 4 }}>
          {isProcessing ? 'Processing...' : 'Drop files here or click to upload'}
        </p>
        <p style={{ fontFamily: monoFont, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          PDF, TXT, JPG, PNG supported
        </p>
      </div>

      {/* Add note button */}
      {!showInput && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowInput(true)}
          style={{
            padding: '12px 16px',
            background: '#fff',
            border: '1px solid #e0e0f0',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: monoFont,
            fontSize: 11,
            color: MUTED,
            letterSpacing: '0.08em',
          }}
        >
          + ADD QUICK NOTE
        </motion.button>
      )}

      {/* Note input */}
      {showInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            padding: 16,
            background: '#fff',
            border: '1px solid #e0e0f0',
            borderRadius: 8,
          }}
        >
          <input
            type="text"
            value={noteName}
            onChange={(e) => setNoteName(e.target.value)}
            placeholder="Note title..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e0e0f0',
              borderRadius: 4,
              marginBottom: 8,
              fontFamily: sansFont,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your medical notes here..."
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e0e0f0',
              borderRadius: 4,
              marginBottom: 8,
              fontFamily: sansFont,
              fontSize: 13,
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddNote}
              disabled={!noteContent.trim() || !noteName.trim()}
              style={{
                padding: '8px 16px',
                background: noteContent.trim() && noteName.trim() ? BLUE : MUTED,
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                fontFamily: monoFont,
                fontSize: 11,
                cursor: noteContent.trim() && noteName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              SAVE NOTE
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowInput(false)
                setNoteContent('')
                setNoteName('')
              }}
              style={{
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #e0e0f0',
                borderRadius: 4,
                color: MUTED,
                fontFamily: monoFont,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              CANCEL
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString()
}

export default function Documents() {
  const { profile } = useProfile()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load documents on mount and profile change
  useEffect(() => {
    if (!profile) {
      setLoading(false)
      return
    }

    const loadDocuments = async () => {
      try {
        await window.api.documents.setProfile(profile.id)
        const docs = await window.api.documents.list()
        setDocuments(docs)
      } catch (error) {
        console.error('Failed to load documents:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [profile])

  const handleFileAdd = async (content: string, name: string, type: 'text' | 'ocr' | 'note') => {
    if (!profile) return

    setIsProcessing(true)
    try {
      const newDoc = await window.api.documents.add({
        type,
        name,
        content,
        metadata: {
          originalName: name,
          size: content.length,
        },
      })
      setDocuments((prev) => [newDoc, ...prev])
    } catch (error) {
      console.error('Failed to add document:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    try {
      await window.api.documents.delete(docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  return (
    <div style={{ padding: '32px', fontFamily: sansFont }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <SectionLabel>Documents</SectionLabel>
        <h1 style={{ fontFamily: sansFont, fontSize: 28, fontWeight: 300, color: NAVY, margin: 0, lineHeight: 1.2 }}>
          <strong style={{ fontWeight: 500 }}>Your</strong> medical documents
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upload */}
        <div>
          <h2 style={{ fontFamily: sansFont, fontSize: 16, fontWeight: 300, color: NAVY, marginBottom: 16 }}>
            <strong style={{ fontWeight: 500 }}>Upload</strong> documents
          </h2>
          <DropZone onFileAdd={handleFileAdd} isProcessing={isProcessing} />
        </div>

        {/* Files List */}
        <div>
          <h2 style={{ fontFamily: sansFont, fontSize: 16, fontWeight: 300, color: NAVY, marginBottom: 16 }}>
            <strong style={{ fontWeight: 500 }}>Uploaded</strong> files
          </h2>
          
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: MUTED }}>
              Loading...
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: MUTED, background: '#fff', borderRadius: 8, border: '1px solid #e0e0f0' }}>
              No documents yet. Upload files or add notes above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    background: '#fff',
                    border: '1px solid #e0e0f0',
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: doc.type === 'note' ? TEAL : doc.type === 'ocr' ? '#E88B1A' : BLUE,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: monoFont,
                      fontSize: 10,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {doc.type === 'note' ? 'NT' : doc.type === 'ocr' ? 'OCR' : 'TXT'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: sansFont, fontSize: 13, fontWeight: 500, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </span>
                    <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED }}>
                      {formatDate(doc.createdAt)} • {doc.content.length} chars
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteDocument(doc.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      border: '1px solid #ffcccc',
                      borderRadius: 4,
                      color: '#cc4444',
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}