import { NavLink } from 'react-router-dom'
import { MessageCircle, LayoutDashboard, History, Settings, Play, FolderOpen, Sliders, FileText, Cpu, Users, Loader, Home } from 'lucide-react'
import { BLUE, TEAL, NAVY, MUTED, monoFont, sansFont } from '../theme'

const navItems = [
  { path: '/', label: 'Home', icon: Home, category: 'site' },
  { path: '/chat', label: 'Chat', icon: MessageCircle, category: 'chat' },
  { path: '/sessions', label: 'Sessions', icon: History, category: 'chat' },
  { path: '/training', label: 'Training', icon: Sliders, category: 'chat' },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'account' },
  { path: '/start-simulation', label: 'New Simulation', icon: Play, category: 'account' },
  { path: '/recent-simulations', label: 'Recent Simulations', icon: FolderOpen, category: 'account' },
  { path: '/documents', label: 'Documents', icon: FileText, category: 'account' },
  { path: '/boot/models', label: 'Models', icon: Cpu, category: 'boot' },
  { path: '/boot/profiles', label: 'Profiles', icon: Users, category: 'boot' },
  { path: '/boot/loading', label: 'Loading', icon: Loader, category: 'boot' },
  { path: '/settings', label: 'Settings', icon: Settings, category: 'settings' },
]

const categories = [
  { key: 'site', label: 'Site' },
  { key: 'chat', label: 'Chat' },
  { key: 'account', label: 'Account' },
  { key: 'boot', label: 'Boot screens' },
  { key: 'settings', label: 'Settings' },
]

function Wordmark() {
  return (
    <p style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 16, letterSpacing: '0.04em', color: NAVY, margin: 0 }}>
      <span style={{ color: BLUE }}>MedLife</span>Sim
    </p>
  )
}

export default function Sidebar() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 200,
        height: '100vh',
        background: '#fff',
        borderRight: '1px solid #e0e0f0',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sansFont,
        zIndex: 100,
        boxSizing: 'border-box',
      }}
    >
      {/* Teal top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: TEAL }} />

      {/* Wordmark */}
      <div style={{ marginBottom: 32 }}>
        <Wordmark />
      </div>

      {/* Nav items grouped by category */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {categories.map((category) => {
          const categoryItems = navItems.filter((item) => item.category === category.key)
          return (
            <div key={category.key}>
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: 10,
                  fontWeight: 600,
                  color: MUTED,
                  letterSpacing: '0.1em',
                  margin: '0 0 8px 12px',
                  textTransform: 'uppercase',
                }}
              >
                {category.label}
              </p>
              {categoryItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/' || item.path === '/dashboard'}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: isActive ? BLUE : 'transparent',
                      borderRadius: 6,
                      textDecoration: 'none',
                      color: isActive ? '#fff' : NAVY,
                      fontFamily: sansFont,
                      fontSize: 13,
                      fontWeight: isActive ? 500 : 400,
                      transition: 'all 0.15s',
                    })}
                  >
                    {({ isActive: _isActive }) => (
                      <>
                        <Icon
                          size={16}
                          style={{
                            flexShrink: 0,
                          }}
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
