import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useProfile } from '../context/ProfileContext'
import { useAI } from '../context/AIContext'
import PageWrapper from '../components/PageWrapper'
import LoRAPicker from '../components/LoRAPicker'
import { BLUE, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont } from '../theme'

/**
 * Inline-style overrides for the assistant's finalized message
 * content. The local LLM frequently formats its replies as
 * markdown (bold for drug names, lists for step-by-step
 * instructions, headings for section breaks, code for dosages,
 * etc.) — we only render the *finalized* message (i.e. once the
 * stream completes) as markdown. The live `streamingContent`
 * stays as plain text so the UI doesn't re-parse on every token.
 */
const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ margin: '8px 0', fontSize: 14, lineHeight: 1.5 }}>{children}</p>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 style={{ fontSize: 18, fontWeight: 700, margin: '12px 0 6px', color: NAVY }}>{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 style={{ fontSize: 16, fontWeight: 700, margin: '10px 0 4px', color: NAVY }}>{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 4px', color: NAVY }}>{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ margin: '6px 0', paddingLeft: 20 }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol style={{ margin: '6px 0', paddingLeft: 20 }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ margin: '2px 0', fontSize: 14, lineHeight: 1.5 }}>{children}</li>
  ),
  // Inline vs block code: react-markdown tags block fences with
  // `className="language-xxx"`, inline code has no language class.
  code: ({
    className,
    children,
    ...rest
  }: {
    className?: string
    children?: React.ReactNode
  } & React.HTMLAttributes<HTMLElement>) => {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return (
        <code
          className={className}
          style={{
            display: 'block',
            fontFamily: monoFont,
            fontSize: 13,
            background: '#f0f0f5',
            padding: 8,
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
            overflowX: 'auto',
            color: NAVY,
          }}
          {...rest}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className={className}
        style={{
          fontFamily: monoFont,
          fontSize: 13,
          background: '#f0f0f5',
          padding: '1px 5px',
          borderRadius: 3,
          color: NAVY,
        }}
        {...rest}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre style={{ margin: '6px 0', overflowX: 'auto' }}>{children}</pre>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ fontWeight: 700 }}>{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em style={{ fontStyle: 'italic' }}>{children}</em>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ color: BLUE, textDecoration: 'underline' }}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote
      style={{
        borderLeft: `3px solid ${MUTED}`,
        paddingLeft: 12,
        margin: '6px 0',
        color: MUTED,
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #e0e0f0', margin: '12px 0' }} />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <table
      style={{
        borderCollapse: 'collapse',
        margin: '8px 0',
        fontSize: 13,
        width: '100%',
      }}
    >
      {children}
    </table>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th
      style={{
        border: '1px solid #e0e0f0',
        padding: '6px 8px',
        background: '#f7f7fc',
        textAlign: 'left',
        fontWeight: 700,
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td style={{ border: '1px solid #e0e0f0', padding: '6px 8px' }}>{children}</td>
  ),
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  thinking?: string
}

interface Session {
  slug: string
  name: string
  createdAt: string
  messageCount: number
}

export default function Chat() {
  const { profile } = useProfile()
  const { isReady, progress } = useAI()
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionSlug = searchParams.get('session') || 'main'
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingThinking, setStreamingThinking] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [showSessionDropdown, setShowSessionDropdown] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const streamingContentRef = useRef('')
  const streamingThinkingRef = useRef('')

  useEffect(() => {
    if (!profile) return
    
    const loadSessions = async () => {
      try {
        const list = await window.api.sessions.list(profile.id)
        setSessions(list)
      } catch (error) {
        console.error('Failed to load sessions:', error)
      }
    }
    
    loadSessions()
  }, [profile, sessionSlug])

  useEffect(() => {
    if (!profile) return

    const loadMessages = async () => {
      try {
        const msgs = await window.api.sessions.loadMessages(profile.id, sessionSlug)
        setMessages(msgs)
      } catch (error) {
        console.error('Failed to load messages:', error)
      }
    }

    loadMessages()
    
  }, [profile, sessionSlug])

  useEffect(() => {
    const unsubToken = window.api.ai.onStreamToken((token) => {
      streamingContentRef.current += token
      setStreamingContent(streamingContentRef.current)
    })

    const unsubThinking = window.api.ai.onStreamThinking((thinking) => {
      streamingThinkingRef.current += thinking
      setStreamingThinking(streamingThinkingRef.current)
    })

    const unsubDone = window.api.ai.onStreamDone(() => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: streamingContentRef.current,
        timestamp: new Date().toISOString(),
        thinking: streamingThinkingRef.current,
      }
      setMessages((prev) => [...prev, assistantMessage])
      streamingContentRef.current = ''
      streamingThinkingRef.current = ''
      setStreamingContent('')
      setStreamingThinking('')
      setLoading(false)
    })

    const unsubError = window.api.ai.onError((error) => {
      console.error('AI error:', error)
      setLoading(false)
    })

    return () => {
      unsubToken()
      unsubThinking()
      unsubDone()
      unsubError()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSessionDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSessionChange = (slug: string) => {
    setSearchParams({ session: slug })
    setShowSessionDropdown(false)
  }

  const handleCreateSession = async () => {
    if (!profile) return

    const slug = `session-${Math.floor(Date.now() / 1000)}`

    try {
      await window.api.sessions.create(profile.id, slug)
      setShowSessionDropdown(false)
      
      const list = await window.api.sessions.list(profile.id)
      setSessions(list)
      setSearchParams({ session: slug })
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading || !profile || !isReady) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    streamingContentRef.current = ''
    streamingThinkingRef.current = ''
    setStreamingContent('')
    setStreamingThinking('')

    const history = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }))

    try {
      const profileContext = profile ? {
        name: profile.name,
        type: profile.type,
        age: profile.age,
        gender: profile.gender,
      } : undefined
      
      await window.api.ai.sendMessage(profile.id, sessionSlug, userMessage.content, history, profileContext)
    } catch (error) {
      console.error('Failed to send message:', error)
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const currentSessionName = sessions.find(s => s.slug === sessionSlug)?.name || sessionSlug

  const buttons = (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { void handleCreateSession() }}
        style={{
          padding: '10px 16px',
          background: BLUE,
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontFamily: monoFont,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          cursor: 'pointer',
        }}
      >
        + NEW SESSION
      </motion.button>
      
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSessionDropdown(!showSessionDropdown)}
          style={{
            padding: '10px 16px',
            background: '#fff',
            border: '1px solid #e0e0f0',
            borderRadius: 8,
            color: NAVY,
            fontFamily: monoFont,
            fontSize: 11,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          SESSIONS
          <span style={{ fontSize: 10 }}>{showSessionDropdown ? '▲' : '▼'}</span>
        </motion.button>
        
        {showSessionDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: '#fff',
              border: '1px solid #e0e0f0',
              borderRadius: 8,
              minWidth: 220,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            {sessions.map((session) => (
              <div
                key={session.slug}
                onClick={() => handleSessionChange(session.slug)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: session.slug === sessionSlug ? LIGHT_BLUE : 'transparent',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = LIGHT_BLUE}
                onMouseLeave={(e) => e.currentTarget.style.background = session.slug === sessionSlug ? LIGHT_BLUE : 'transparent'}
              >
                <span style={{ fontFamily: sansFont, fontSize: 13, color: NAVY }}>
                  {session.name}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: sansFont }}>
        <PageWrapper title={currentSessionName} category="Chat" buttons={buttons}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 0', borderTop: '1px solid #e0e0f0', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 && !loading && (
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', color: MUTED, gap: 8 }}>
              <p style={{ fontFamily: monoFont, fontSize: 13, margin: 0 }}>No messages yet</p>
              <p style={{ fontSize: 14, margin: 0 }}>Start a conversation with your health assistant</p>
            </div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {message.role === 'assistant' && message.thinking && (
                <div
                  style={{
                    marginBottom: 8,
                    maxWidth: '70%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: LIGHT_BLUE,
                    border: '1px solid #e0e0f0',
                    fontSize: 12,
                    color: MUTED,
                  }}
                >
                  <p style={{ margin: 0, fontFamily: monoFont, fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>
                    Thinking...
                  </p>
                  <p style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{message.thinking.trimStart()}</p>
                </div>
              )}
              
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: message.role === 'user' ? BLUE : '#fff',
                  color: message.role === 'user' ? '#fff' : NAVY,
                  border: message.role === 'user' ? 'none' : '1px solid #e0e0f0',
                }}
              >
                {message.role === 'assistant' ? (
                  // Once the stream completes, the content is finalised
                  // and we render it as markdown so the model's
                  // formatting (lists, **bold** drug names, code for
                  // dosages, tables, etc.) shows up properly. The live
                  // `streamingContent` block below stays plain text so
                  // we don't re-parse on every token.
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {message.content.trimStart()}
                  </ReactMarkdown>
                ) : (
                  <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>
                    {message.content.trimStart()}
                  </p>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 24 }}
            >
              {streamingThinking && (
                <div
                  style={{
                    marginBottom: 8,
                    maxWidth: '70%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: LIGHT_BLUE,
                    border: '1px solid #e0e0f0',
                  }}
                >
                  <p style={{ margin: 0, fontFamily: monoFont, fontSize: 10, textTransform: 'uppercase', color: MUTED }}>
                    Thinking...
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, whiteSpace: 'pre-wrap', color: MUTED }}>
                    {streamingThinking.trimStart()}
                  </p>
                </div>
              )}
              
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#fff',
                  border: '1px solid #e0e0f0',
                }}
              >
                {streamingContent ? (
                  <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>{streamingContent.trimStart()}</p>
                ) : (
                  <p style={{ margin: 0, fontSize: 14, color: MUTED }}>Thinking...</p>
                )}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 0 0', borderTop: '1px solid #e0e0f0' }}>
          {!isReady && (
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 11,
                color: MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {progress
                ? `${progress.phase === 'downloading' ? 'Downloading' : 'Loading'} model… ${Math.round(progress.percentage)}%`
                : 'Model not ready — pick one from the model screen.'}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              gap: 12,
              background: '#fff',
              border: '1px solid #e0e0f0',
              borderRadius: 12,
              padding: 4,
            }}
          >
            <div style={{ alignSelf: 'center', borderRight: '1px solid #f0f0f0', paddingRight: 4 }}>
              <LoRAPicker />
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isReady ? 'Start chat with QVAC MedPsy…' : 'Waiting for model to load…'}
              disabled={loading || !isReady}
              style={{
                flex: 1,
                border: 'none',
                padding: '12px 16px',
                fontSize: 14,
                fontFamily: sansFont,
                resize: 'none',
                outline: 'none',
                background: 'transparent',
              }}
              rows={1}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={!input.trim() || loading || !isReady}
              style={{
                padding: '12px 24px',
                background: input.trim() && !loading && isReady ? BLUE : MUTED,
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontFamily: monoFont,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.1em',
                cursor: input.trim() && !loading && isReady ? 'pointer' : 'not-allowed',
              }}
            >
              SEND
            </motion.button>
          </div>
        </div>
        </div>
      </PageWrapper>
    </div>
  )
}
