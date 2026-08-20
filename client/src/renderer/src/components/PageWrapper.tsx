import { motion } from 'framer-motion'
import { MUTED, monoFont, sansFont } from '../theme'

interface PageWrapperProps {
  title: string
  category?: string
  buttons?: React.ReactNode
  children: React.ReactNode
}

export default function PageWrapper({ title, category, buttons, children }: PageWrapperProps) {
  return (
    <div style={{ padding: '32px 48px', overflowY: 'auto', height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          {category && (
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 11,
                letterSpacing: '0.14em',
                color: MUTED,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {category}
            </p>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: sansFont,
              fontSize: 28,
              fontWeight: 300,
              color: '#1a1a2e',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </motion.h1>
        </div>
        {buttons && <div style={{ display: 'flex', gap: 8 }}>{buttons}</div>}
      </div>
      {children}
    </div>
  )
}
