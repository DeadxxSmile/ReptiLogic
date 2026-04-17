import React, { useState, useEffect } from 'react'
import { useAsync } from '../hooks/useData'
import { LoadingSpinner } from '../components/shared'
import './SettingsPage.css'

export default function SettingsPage() {
  const { data: settings, loading, refetch } = useAsync(() => window.api.settings.getAll(), [])
  const { data: morphCount } = useAsync(() => window.api.morphs.getCount(), [])
  const [saved,      setSaved]      = useState(false)
  const [busyAction, setBusyAction] = useState(null)
  const [result,     setResult]     = useState(null)

  // ── Light mode ──────────────────────────────────────────────────────────────
  const [lightMode, setLightMode] = useState(() => {
    return document.body.classList.contains('light-mode')
  })

  const toggleLightMode = async (val) => {
    document.body.classList.toggle('light-mode', val)
    setLightMode(val)
    await window.api.settings.set('light_mode', val ? '1' : '0')
  }

  // Apply saved light mode preference on mount
  useEffect(() => {
    if (settings?.light_mode === '1') {
      document.body.classList.add('light-mode')
      setLightMode(true)
    } else {
      document.body.classList.remove('light-mode')
      setLightMode(false)
    }
  }, [settings?.light_mode])

  // ── Database path ────────────────────────────────────────────────────────────
  const [dbPath,       setDbPath]       = useState(null)
  const [dbMoving,     setDbMoving]     = useState(false)
  const [dbMoveResult, setDbMoveResult] = useState(null)

  useEffect(() => {
    window.api.db.getPath().then(setDbPath)
  }, [])

  const handleChangeDbLocation = async () => {
    setDbMoving(true)
    setDbMoveResult(null)
    try {
      const folder = await window.api.db.chooseFolder()
      if (!folder) { setDbMoving(false); return }

      const result = await window.api.db.setPath(folder)

      if (result.unchanged) {
        setDbMoveResult({ success: true, message: 'Database is already stored in that location.' })
        setDbMoving(false)
        return
      }

      if (!result.success) {
        setDbMoveResult({ success: false, message: result.error })
        setDbMoving(false)
        return
      }

      if (result.existedAtDestination) {
        setDbMoveResult({
          success: true,
          message: `Database copied to ${result.path}. An existing database was found there — the current data has been written over it. Restart the app to load from the new location.`,
          warning: true,
        })
      } else {
        setDbMoveResult({
          success: true,
          message: `Database copied to ${result.path}. Restart the app to load from the new location.`,
        })
      }
      setDbPath(result.path)
    } catch (e) {
      setDbMoveResult({ success: false, message: e.message || 'Failed to move database.' })
    } finally {
      setDbMoving(false)
    }
  }

  // ── General action runner ────────────────────────────────────────────────────
  const setSetting = async (key, value) => {
    if (!settings) return
    await window.api.settings.set(key, value)
    await refetch().catch(() => {})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const runAction = async (actionKey, actionFn, successLabel) => {
    setBusyAction(actionKey)
    setResult(null)
    try {
      const response = await actionFn()
      if (!response) return
      setResult({
        success: response.success !== false,
        message: response.success === false
          ? response.error || 'The action could not be completed.'
          : successLabel(response),
        errors: response.errors || [],
      })
      await refetch().catch(() => {})
    } catch (error) {
      setResult({ success: false, message: error.message || 'Something went wrong.', errors: [] })
    } finally {
      setBusyAction(null)
    }
  }

  const handleExport = (type) => runAction(
    `export:${type}`,
    async () => {
      const folder = await window.api.export.chooseFolder()
      if (!folder) return null
      if (type === 'collection') return window.api.export.collectionCsv(folder)
      if (type === 'breeding')   return window.api.export.breedingCsv(folder)
      if (type === 'backup')     return window.api.export.fullBackup(folder)
      if (type === 'morphs')     return window.api.export.morphsCsv(folder)
      if (type === 'template')   return window.api.export.importTemplateCsv(folder)
      return null
    },
    response => {
      if (type === 'template') return `Template saved to ${response.path}`
      return `Saved to ${response.path}${response.count != null ? ` (${response.count} records)` : ''}`
    }
  )

  const handleImport = (type) => runAction(
    `import:${type}`,
    async () => {
      const file = await window.api.importData.chooseImportFile()
      if (!file) return null
      return window.api.importData.restoreAny(file)
    },
    response => {
      const imported = response.imported != null ? ` (${response.imported} records)` : ''
      return `${response.message || 'Import completed.'}${imported}`
    }
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        {saved && <span style={{ color: 'var(--accent-text)', fontSize: 13 }}>✓ Saved</span>}
      </div>

      {/* ── Preferences ─────────────────────────────────────── */}
      <section className="settings-section">
        <h2>Preferences</h2>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>Appearance</span>
            <span className="settings-row-sub">Switch between dark and light mode</span>
          </div>
          <div className="filter-group">
            <button
              className={`filter-btn ${!lightMode ? 'active' : ''}`}
              onClick={() => toggleLightMode(false)}
            >🌙 Dark</button>
            <button
              className={`filter-btn ${lightMode ? 'active' : ''}`}
              onClick={() => toggleLightMode(true)}
            >☀️ Light</button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>Temperature unit</span>
            <span className="settings-row-sub">Used for incubation temperatures</span>
          </div>
          <div className="filter-group">
            {[['fahrenheit', '°F'], ['celsius', '°C']].map(([val, label]) => (
              <button
                key={val}
                className={`filter-btn ${settings?.temp_unit === val ? 'active' : ''}`}
                onClick={() => setSetting('temp_unit', val)}
              >{label}</button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>Weight unit</span>
            <span className="settings-row-sub">Used throughout the app</span>
          </div>
          <div className="filter-group">
            {[['grams', 'Grams'], ['ounces', 'Ounces']].map(([val, label]) => (
              <button
                key={val}
                className={`filter-btn ${settings?.weight_unit === val ? 'active' : ''}`}
                onClick={() => setSetting('weight_unit', val)}
              >{label}</button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>Default species</span>
            <span className="settings-row-sub">Pre-selected when adding animals</span>
          </div>
          <select
            className="form-select" style={{ width: 220 }}
            value={settings?.default_species || 'ball_python'}
            onChange={e => setSetting('default_species', e.target.value)}
          >
            <option value="ball_python">Ball Python</option>
            <option value="western_hognose">Western Hognose</option>
            <option value="corn_snake">Corn Snake</option>
            <option value="boa_constrictor">Boa Constrictor</option>
            <option value="carpet_python">Carpet Python</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>Feeding reminder threshold</span>
            <span className="settings-row-sub">Days before showing a feeding reminder on the dashboard</span>
          </div>
          <select className="form-select" style={{ width: 140 }}
            value={settings?.feeding_reminder_days || '14'}
            onChange={e => setSetting('feeding_reminder_days', e.target.value)}
          >
            {[7, 10, 14, 21, 28].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>Weighing reminder threshold</span>
            <span className="settings-row-sub">Days before showing a weight reminder on the dashboard</span>
          </div>
          <select className="form-select" style={{ width: 140 }}
            value={settings?.weighing_reminder_days || '30'}
            onChange={e => setSetting('weighing_reminder_days', e.target.value)}
          >
            {[14, 21, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
      </section>

      {/* ── Database location ────────────────────────────────── */}
      <section className="settings-section">
        <h2>Database location</h2>
        <p className="settings-helper-copy">
          Move your database to a synced folder like OneDrive or Dropbox to keep a live backup or share between machines.
          ReptiLogic will create a <code>ReptiLogic/</code> subfolder inside whichever folder you choose.
          The app must be restarted after changing the location.
        </p>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: '100%' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="settings-row-label">
                <span>Current location</span>
                <span className="settings-row-sub" style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  wordBreak: 'break-all', marginTop: 4,
                  color: 'var(--text-secondary)',
                }}>
                  {dbPath || '—'}
                </span>
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleChangeDbLocation}
              disabled={dbMoving}
            >
              {dbMoving ? '⏳ Moving…' : '📂 Change location'}
            </button>
          </div>

          {dbMoveResult && (
            <div style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              background: dbMoveResult.success
                ? (dbMoveResult.warning ? 'var(--amber-dim)' : 'var(--accent-dim)')
                : 'var(--red-dim)',
              color: dbMoveResult.success
                ? (dbMoveResult.warning ? 'var(--amber-text)' : 'var(--accent-text)')
                : 'var(--red-text)',
              border: `1px solid ${dbMoveResult.success
                ? (dbMoveResult.warning ? 'var(--amber)' : 'var(--accent)')
                : 'var(--red)'}`,
            }}>
              {dbMoveResult.success ? (dbMoveResult.warning ? '⚠ ' : '✓ ') : '✗ '}
              {dbMoveResult.message}
            </div>
          )}
        </div>
      </section>

      {/* ── Export ───────────────────────────────────────────── */}
      <section className="settings-section">
        <h2>Export data</h2>
        <p className="settings-helper-copy">
          Export your live collection, breeding records, custom morph library, full backup, or a starter CSV template.
        </p>
        <ResultBanner result={result} />
        <div className="export-cards">
          <ActionCard title="Collection CSV" icon="🐍" actionLabel="Export"
            description="All animals with morphs, dates, weights, and notes."
            onAction={() => handleExport('collection')} loading={busyAction === 'export:collection'} />
          <ActionCard title="Breeding CSV" icon="🥚" actionLabel="Export"
            description="All pairing records with dates, egg counts, and hatch totals."
            onAction={() => handleExport('breeding')} loading={busyAction === 'export:breeding'} />
          <ActionCard title="Morph CSV" icon="🧬" actionLabel="Export"
            description="All morphs including custom user-created ones."
            onAction={() => handleExport('morphs')} loading={busyAction === 'export:morphs'} />
          <ActionCard title="Full backup" icon="💾" actionLabel="Backup"
            description="Creates a .db backup you can restore later."
            onAction={() => handleExport('backup')} loading={busyAction === 'export:backup'} accent />
          <ActionCard title="CSV template" icon="📄" actionLabel="Save template"
            description="Blank starter template for filling in your collection in Excel."
            onAction={() => handleExport('template')} loading={busyAction === 'export:template'} />
        </div>
      </section>

      {/* ── Import ───────────────────────────────────────────── */}
      <section className="settings-section">
        <h2>Import data</h2>
        <p className="settings-helper-copy">
          Import any file exported by ReptiLogic — collection CSV, breeding CSV, morph CSV, or a full database backup.
        </p>
        <div className="export-cards">
          <ActionCard title="Import or restore" icon="📥" actionLabel="Choose file"
            description="Choose any exported ReptiLogic file and the app will detect the format automatically."
            onAction={() => handleImport('restore')} loading={busyAction === 'import:restore'} accent />
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────── */}
      <section className="settings-section">
        <h2>About</h2>
        <div className="about-card card" style={{ maxWidth: 560 }}>
          <div className="about-card-inner">
            <img src="./logo.png" alt="ReptiLogic" className="about-logo" />
            <table className="about-table">
              <tbody>
                <AboutRow label="App"      value="ReptiLogic" />
                <AboutRow label="Version"  value="1.0.1" />
                <AboutRow label="Author"   value="Deadx_xSmile" />
                <AboutRow label="Source"   value={
                  <a href="https://github.com/DeadxxSmile/ReptiLogic"
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent-text)' }}>
                    github.com/DeadxxSmile/ReptiLogic
                  </a>
                } />
                <AboutRow label="Total morphs"      value={morphCount ? `${morphCount.total} in database` : '—'} />
                <AboutRow label="Species supported" value="10 (more via migration)" />
                <AboutRow label="Data storage"      value="Local SQLite database" />
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function AboutRow({ label, value }) {
  return (
    <tr>
      <td style={{ color: 'var(--text-muted)', padding: '6px 0', paddingRight: 20, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '6px 0' }}>{value}</td>
    </tr>
  )
}

function ResultBanner({ result }) {
  if (!result) return null
  return (
    <div className={`settings-result ${result.success ? 'settings-result-success' : 'settings-result-error'}`}>
      <div>{result.success ? '✓' : '✗'} {result.message}</div>
      {result.errors?.length > 0 && (
        <ul className="settings-result-errors">
          {result.errors.slice(0, 8).map(e => <li key={e}>{e}</li>)}
          {result.errors.length > 8 && <li>...and {result.errors.length - 8} more.</li>}
        </ul>
      )}
    </div>
  )
}

function ActionCard({ title, description, icon, actionLabel, onAction, loading, accent = false }) {
  return (
    <div className={`export-card ${accent ? 'export-card-accent' : ''}`}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <h3 style={{ marginBottom: 4, fontSize: 14 }}>{title}</h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, flex: 1 }}>{description}</p>
      <button
        className={`btn ${accent ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        onClick={onAction} disabled={loading} style={{ alignSelf: 'flex-start' }}
      >
        {loading ? 'Working…' : actionLabel}
      </button>
    </div>
  )
}
