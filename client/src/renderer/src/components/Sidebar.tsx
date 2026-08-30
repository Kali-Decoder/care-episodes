'use client'

import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  ClipboardList,
  BarChart3,
  User,
  LogOut,
  Settings,
} from 'lucide-react'
import {
  BLUE,
  NAVY,
  MUTED,
  BORDER,
  BORDER_LIGHT,
  LIGHT_BLUE,
  TEXT_SECONDARY,
  sansFont,
  monoFont,
} from '../theme'
import { CARE_ANALYTICS, CARE_EPISODES, CARE_HOME, CARE_PROFILE } from '../../../care/routes'
import { useProfile } from '../context/ProfileContext'
import NaniLogo from './NaniLogo'

const careNav = [
  { path: CARE_HOME, label: 'Dashboard', icon: Activity, category: 'care' },
  { path: CARE_EPISODES, label: 'Episodes', icon: ClipboardList, category: 'care' },
  { path: CARE_ANALYTICS, label: 'Analytics', icon: BarChart3, category: 'care' },
]

const extendedNav = [
  { path: CARE_PROFILE, label: 'Profile', icon: User, category: 'account' },
  { path: '/settings', label: 'Settings', icon: Settings, category: 'account' },
]

const navItems = [...careNav, ...extendedNav]

const categories = [
  { key: 'care', label: 'NaniAi' },
  { key: 'account', label: 'Account' },
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
        background: LIGHT_BLUE,
        borderRight: `1px solid ${BORDER}`,
        padding: '24px 14px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sansFont,
        zIndex: 100,
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <NaniLogo size={36} textSize={15} />
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: MUTED,
            margin: '8px 0 0',
            paddingLeft: 2,
          }}
        >
          Patient view
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {categories.map((category) => {
          const categoryItems = navItems.filter((item) => item.category === category.key)
          if (categoryItems.length === 0) return null
          return (
            <div key={category.key}>
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  fontWeight: 600,
                  color: MUTED,
                  letterSpacing: '0.14em',
                  margin: '0 0 8px 10px',
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
                      background: isActive ? '#fff' : 'transparent',
                      borderRadius: 12,
                      textDecoration: 'none',
                      color: isActive ? NAVY : TEXT_SECONDARY,
                      fontFamily: sansFont,
                      fontSize: 13,
                      fontWeight: isActive ? 500 : 400,
                      transition: 'all 0.15s',
                      border: isActive ? `1px solid ${BORDER}` : '1px solid transparent',
                      boxShadow: isActive ? '0 2px 8px rgba(44, 40, 37, 0.04)' : 'none',
                      marginBottom: 2,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={16}
                          style={{ flexShrink: 0, color: isActive ? BLUE : MUTED }}
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

      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${BORDER_LIGHT}` }}>
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
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            color: MUTED,
            fontFamily: sansFont,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#C45C5C44'
            e.currentTarget.style.color = '#C45C5C'
            e.currentTarget.style.background = '#FDF5F5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = BORDER
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
