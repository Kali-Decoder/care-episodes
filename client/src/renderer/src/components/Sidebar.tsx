import { NavLink } from 'react-router-dom'
import {
  MessageCircle,
  LayoutDashboard,
  History,
  Settings,
  Play,
  FolderOpen,
  Sliders,
  FileText,
  Cpu,
  Users,
  Loader,
  Home,
  Activity,
} from 'lucide-react'
import { BLUE, TEAL, NAVY, MUTED, monoFont, sansFont } from '../theme'
import { CARE_HOME } from '../../../care/routes'
import NaniLogo from './NaniLogo'

/** Primary NaniAi nav — always visible. */
const careNav = [
  { path: CARE_HOME, label: 'Dashboard', icon: Activity, category: 'care' },
  { path: '/welcome', label: 'About', icon: Home, category: 'care' },
]

/** Kept for future features — routes and pages unchanged. */
const extendedNav = [
  { path: '/chat', label: 'Chat', icon: MessageCircle, category: 'extend' },
  { path: '/sessions', label: 'Sessions', icon: History, category: 'extend' },
  { path: '/documents', label: 'Documents', icon: FileText, category: 'extend' },
  { path: '/sim-dashboard', label: 'Insights', icon: LayoutDashboard, category: 'extend' },
  { path: '/start-simulation', label: 'Simulations', icon: Play, category: 'extend' },
  { path: '/recent-simulations', label: 'Recent sims', icon: FolderOpen, category: 'extend' },
  { path: '/training', label: 'Training', icon: Sliders, category: 'extend' },
  { path: '/boot/models', label: 'Models', icon: Cpu, category: 'dev' },
  { path: '/boot/profiles', label: 'Profiles', icon: Users, category: 'dev' },
  { path: '/boot/loading', label: 'Loading', icon: Loader, category: 'dev' },
  { path: '/settings', label: 'Settings', icon: Settings, category: 'account' },
]

const navItems = [...careNav, ...extendedNav]

const categories = [
  { key: 'care', label: 'NaniAi' },
  { key: 'extend', label: 'More' },
  { key: 'account', label: 'Account' },
  { key: 'dev', label: 'Dev screens' },
]

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
        overflowY: 'auto',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: TEAL }} />

      <div style={{ marginBottom: 24 }}>
        <NaniLogo size={36} textSize={15} />
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: MUTED,
            margin: '6px 0 0',
            paddingLeft: 2,
          }}
        >
          Patient view
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {categories.map((category) => {
          const categoryItems = navItems.filter((item) => item.category === category.key)
          if (categoryItems.length === 0) return null
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
                    end={item.path === CARE_HOME || item.path === '/welcome' || item.path === '/sim-dashboard'}
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
                        <Icon size={16} style={{ flexShrink: 0 }} />
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
