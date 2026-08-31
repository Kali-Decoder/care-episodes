'use client'

import { NavLink, useNavigate } from 'react-router-dom'
import {
  // MessageCircle,
  // LayoutDashboard,
  // History,
  // Settings,
  // Play,
  // FolderOpen,
  // Sliders,
  // FileText,
  // Cpu,
  // Loader,
  // Home,
  Activity,
  ClipboardList,
  BarChart3,
  User,
  LogOut,
} from 'lucide-react'
import { BLUE, TEAL, NAVY, MUTED, monoFont, sansFont } from '../theme'
import { CARE_ANALYTICS, CARE_EPISODES, CARE_HOME, CARE_PROFILE } from '../../../care/routes'
import { useProfile } from '../context/ProfileContext'
import NaniLogo from './NaniLogo'

/** Primary NaniAi nav — always visible. */
const careNav = [
  { path: CARE_HOME, label: 'Dashboard', icon: Activity, category: 'care' },
  { path: CARE_EPISODES, label: 'Episodes', icon: ClipboardList, category: 'care' },
  { path: CARE_ANALYTICS, label: 'Analytics', icon: BarChart3, category: 'care' },
  // { path: '/', label: 'About', icon: Home, category: 'care' },
]

/** Kept for future features — routes and pages unchanged. */
const extendedNav = [
  // { path: '/chat', label: 'Chat', icon: MessageCircle, category: 'extend' },
  // { path: '/sessions', label: 'Sessions', icon: History, category: 'extend' },
  // { path: '/documents', label: 'Documents', icon: FileText, category: 'extend' },
  // { path: '/sim-dashboard', label: 'Insights', icon: LayoutDashboard, category: 'extend' },
  // { path: '/start-simulation', label: 'Simulations', icon: Play, category: 'extend' },
  // { path: '/recent-simulations', label: 'Recent sims', icon: FolderOpen, category: 'extend' },
  // { path: '/training', label: 'Training', icon: Sliders, category: 'extend' },
  // { path: '/boot/models', label: 'Models', icon: Cpu, category: 'dev' },
  // { path: '/boot/profiles', label: 'Profiles', icon: Users, category: 'dev' },
  // { path: '/boot/loading', label: 'Loading', icon: Loader, category: 'dev' },
  { path: CARE_PROFILE, label: 'Profile', icon: User, category: 'account' },
  // { path: '/settings', label: 'Settings', icon: Settings, category: 'account' },
]

const navItems = [...careNav, ...extendedNav]

const categories = [
  { key: 'care', label: 'NaniAi' },
  { key: 'extend', label: 'More' },
  { key: 'account', label: 'Account' },
  { key: 'dev', label: 'Dev screens' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { setProfile } = useProfile()

  const handleLogout = () => {
    setProfile(null)
    navigate('/')
  }

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
        <NaniLogo size={36} textSize={15} href="/" />
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
                    end={item.path === CARE_HOME}
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

      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #e0e0f0' }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '10px 12px',
            background: 'transparent',
            border: '1px solid #e0e0f0',
            borderRadius: 6,
            color: MUTED,
            fontFamily: sansFont,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#c8303044'
            e.currentTarget.style.color = '#c83030'
            e.currentTarget.style.background = '#fff5f5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e0e0f0'
            e.currentTarget.style.color = MUTED
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )
}
