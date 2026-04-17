import React, { useState, useEffect } from 'react'
import './TitleBar.css'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    // Sync initial state
    window.api.window.isMaximized().then(setMaximized)

    // Listen for changes
    const handler = (val) => setMaximized(val)
    window.api.window.onMaximized(handler)
    return () => window.api.window.offMaximized(handler)
  }, [])

  return (
    <div className="titlebar">
      {/* Drag region fills the whole bar */}
      <div className="titlebar-drag" />

      {/* Centered logo + name */}
      <div className="titlebar-center">
        <img src="./logo.png" alt="" className="titlebar-logo" />
        <span className="titlebar-title">ReptiLogic</span>
      </div>

      {/* Window controls — right side, not draggable */}
      <div className="titlebar-controls">
        <button
          className="titlebar-btn titlebar-btn--minimize"
          onClick={() => window.api.window.minimize()}
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>

        <button
          className="titlebar-btn titlebar-btn--maximize"
          onClick={() => window.api.window.maximize()}
          title={maximized ? 'Restore' : 'Maximize'}
        >
          {maximized ? (
            // Restore icon (two overlapping squares)
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M3 1H9V7H3V1ZM1 3V9H7V7H3V3H1Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          ) : (
            // Maximize icon (single square)
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" />
            </svg>
          )}
        </button>

        <button
          className="titlebar-btn titlebar-btn--close"
          onClick={() => window.api.window.close()}
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M1 1L9 9M9 1L1 9"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
