import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProfile } from '../context/ProfileContext'
import PageWrapper from '../components/PageWrapper'
import { TEAL, MUTED, monoFont, sansFont } from '../theme'
import { relativeDate } from '../utils/format'

interface Session {
  slug: string
  name: string
  createdAt: string
  messageCount: number
}

export default function Sessions() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) {
      setLoading(false)
      return
    }

    const loadSessions = async () => {
      try {
        const list = await window.api.sessions.list(profile.id)
        setSessions(list)
      } catch (error) {
        console.error('Failed to load sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [profile])

  const handleSessionClick = (slug: string) => {
    navigate(`/chat?session=${slug}`)
  }

  const handleClearMessages = async (slug: string, name: string) => {
    if (!profile) return
    
    const confirmed = window.confirm(`Clear all messages in "${name}"?`)
    if (!confirmed) return

    try {
      await window.api.sessions.clearMessages(profile.id, slug)
      const list = await window.api.sessions.list(profile.id)
      setSessions(list)
    } catch (error) {
      console.error('Failed to clear messages:', error)
    }
  }

  const handleDeleteSession = async (slug: string, name: string) => {
    if (!profile) return
    
    const confirmed = window.confirm(`Delete "${name}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await window.api.sessions.delete(profile.id, slug)
      const list = await window.api.sessions.list(profile.id)
      setSessions(list)
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  return (
    <PageWrapper title="Your conversations" category="Chat">
      <div style={{ background: '#fff', border: '1px solid #e0e0f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ height: 3, background: TEAL }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 60px', padding: '12px 16px', background: '#f7f7fc', borderBottom: '1px solid #e0e0f0' }}>
          <span style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>Conversation</span>
          <span style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>Date</span>
          <span style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', textAlign: 'right' }}>Messages</span>
          <span style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>Actions</span>
        </div>

        <div>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: MUTED }}>
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: MUTED }}>
              No conversations yet. Start chatting!
            </div>
          ) : (
            sessions.map((session, index) => (
              <motion.div
                key={session.slug}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 100px 60px',
                  padding: '16px',
                  borderBottom: index < sessions.length - 1 ? '1px solid #e0e0f0' : 'none',
                  alignItems: 'center',
                }}
              >
                <div 
                  onClick={() => handleSessionClick(session.slug)}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ fontFamily: sansFont, fontSize: 14, color: '#1a1a2e', fontWeight: 500 }}>{session.name}</span>
                </div>
                <span style={{ fontFamily: monoFont, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{relativeDate(session.createdAt)}</span>
                <span style={{ fontFamily: monoFont, fontSize: 12, color: MUTED, textAlign: 'right' }}>{session.messageCount}</span>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {session.slug === 'main' && (
                    <button
                      onClick={() => handleClearMessages(session.slug, session.name)}
                      title="Clear messages"
                      style={{
                        padding: '6px 10px',
                        background: '#fff',
                        border: '1px solid #e0e0f0',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 11,
                        color: MUTED,
                      }}
                    >
                      Clear
                    </button>
                  )}
                  {session.slug !== 'main' && (
                    <button
                      onClick={() => handleDeleteSession(session.slug, session.name)}
                      title="Delete session"
                      style={{
                        padding: '6px 10px',
                        background: '#fff',
                        border: '1px solid #ffcccc',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 11,
                        color: '#cc4444',
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
