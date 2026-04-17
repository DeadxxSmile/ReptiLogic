import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import TitleBar from './components/TitleBar'
import './styles/App.css'

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',    icon: '🏠' },
  { to: '/collection', label: 'Collection',   icon: '🐍' },
  { to: '/health',     label: 'Health',        icon: '🏥' },
  { to: '/breeding',   label: 'Breeding',      icon: '🥚' },
  { to: '/genetics',   label: 'Genetics Calc', icon: '🧬' },
  { to: '/morphs',     label: 'Morph Library', icon: '📖' },
  { to: '/settings',   label: 'Settings',      icon: '⚙️'  },
]

export default function App() {
  const [navCollapsed, setNavCollapsed] = useState(false)

  return (
    <div className="app-root">

      {/* ── Custom title bar ─────────────────────────────────── */}
      <TitleBar />

      {/* ── Body: sidebar + content ──────────────────────────── */}
      <div className={`app-shell ${navCollapsed ? 'nav-collapsed' : ''}`}>

        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="./logo.png" alt="" className="logo-img" />
            {!navCollapsed && <span className="logo-text">ReptiLogic</span>}
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
                title={navCollapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!navCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <button
            className="nav-collapse-btn"
            onClick={() => setNavCollapsed(v => !v)}
            title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {navCollapsed ? '›' : '‹'}
          </button>
        </aside>

        <main className="main-content">
          <div className="content-scroll">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
