import { useState } from 'react'
import { Cpu, Activity, Share2 } from 'lucide-react'
import { BLUE, NAVY, sansFont } from '../../theme'
import AIConfiguration from './AIConfiguration'
import WorkerConfiguration from './WorkerConfiguration'
import SharedResources from './SharedResources'

const tabs = [
  { key: 'ai', label: 'AI Configuration', icon: Cpu },
  { key: 'worker', label: 'Worker', icon: Activity },
  { key: 'shared', label: 'Shared Resources', icon: Share2 },
]

export default function SettingsLayout() {
  const [activeTab, setActiveTab] = useState('ai')

  const renderContent = () => {
    switch (activeTab) {
      case 'ai':
        return <AIConfiguration />
      case 'worker':
        return <WorkerConfiguration />
      case 'shared':
        return <SharedResources />
      default:
        return <AIConfiguration />
    }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Vertical sidebar tabs */}
      <div
        style={{
          width: 200,
          borderRight: '1px solid #e0e0f0',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          background: '#fff',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: isActive ? BLUE : 'transparent',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                color: isActive ? '#fff' : NAVY,
                fontFamily: sansFont,
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', minHeight:"100vh" }}>
        {renderContent()}
      </div>
    </div>
  )
}
