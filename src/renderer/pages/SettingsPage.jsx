import React, { useState } from 'react'
import { useAsync } from '../hooks/useData'
import { LoadingSpinner } from '../components/shared'
import './SettingsPage.css'

export default function SettingsPage() {
  const { data: settings, loading, refetch } = useAsync(() => window.api.settings.getAll(), [])
  const [saved, setSaved] = useState(false)
  const [busyAction, setBusyAction] = useState(null)
  const [result, setResult] = useState(null)

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
      if (type === 'breeding') return window.api.export.breedingCsv(folder)
      if (type === 'backup') return window.api.export.fullBackup(folder)
      if (type === 'morphs') return window.api.export.morphsCsv(folder)
      if (type === 'template') return window.api.export.importTemplateCsv(folder)
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

      <section className="settings-section">
        <h2>Preferences</h2>

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
              >
                {label}
              </button>
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
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>Default species</span>
            <span className="settings-row-sub">Pre-selected when adding animals</span>
          </div>
          <select
            className="form-select"
            style={{ width: 220 }}
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
          <select
            className="form-select"
            style={{ width: 140 }}
            value={settings?.feeding_reminder_days || '14'}
            onChange={e => setSetting('feeding_reminder_days', e.target.value)}
          >
            {[7, 10, 14, 21, 28].map(d => (
              <option key={d} value={d}>{d} days</option>
            ))}
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>Weighing reminder threshold</span>
            <span className="settings-row-sub">Days before showing a weight reminder on the dashboard</span>
          </div>
          <select
            className="form-select"
            style={{ width: 140 }}
            value={settings?.weighing_reminder_days || '30'}
            onChange={e => setSetting('weighing_reminder_days', e.target.value)}
          >
            {[14, 21, 30, 45, 60, 90].map(d => (
              <option key={d} value={d}>{d} days</option>
            ))}
          </select>
        </div>
      </section>

      <section className="settings-section">
        <h2>Export data</h2>
        <p className="settings-helper-copy">
          Export your live collection, breeding records, custom morph library, full backup database, or a starter CSV template.
        </p>

        <ResultBanner result={result} />

        <div className="export-cards">
          <ActionCard
            title="Collection CSV"
            description="All animals with morphs, dates, weights, and notes. Great for spreadsheet backups."
            icon="🐍"
            actionLabel="Export"
            onAction={() => handleExport('collection')}
            loading={busyAction === 'export:collection'}
          />
          <ActionCard
            title="Breeding CSV"
            description="All pairing records with dates, egg counts, and hatch totals."
            icon="🥚"
            actionLabel="Export"
            onAction={() => handleExport('breeding')}
            loading={busyAction === 'export:breeding'}
          />
          <ActionCard
            title="Morph CSV"
            description="Exports all morph records, including custom user-created morphs, so they can be shared or imported on another setup."
            icon="🧬"
            actionLabel="Export"
            onAction={() => handleExport('morphs')}
            loading={busyAction === 'export:morphs'}
          />
          <ActionCard
            title="Full backup"
            description="Creates a database backup you can restore later if you move PCs or want a full snapshot."
            icon="💾"
            actionLabel="Backup"
            onAction={() => handleExport('backup')}
            loading={busyAction === 'export:backup'}
            accent
          />
          <ActionCard
            title="CSV template"
            description="Exports a clean starter template from the resources folder so keepers can fill out their collection in Excel first."
            icon="📄"
            actionLabel="Save template"
            onAction={() => handleExport('template')}
            loading={busyAction === 'export:template'}
          />
        </div>
      </section>

      <section className="settings-section">
        <h2>Import data</h2>
        <p className="settings-helper-copy">
          Import any file exported by ReptiLogic: collection CSV, breeding CSV, morph CSV, or a full database backup. Collection spreadsheets can still be imported from CSV as well.
        </p>

        <div className="export-cards">
          <ActionCard
            title="Import or restore export file"
            description="Choose any exported ReptiLogic file — collection, breeding, morphs, or full backup — and the app will detect the format automatically."
            icon="📥"
            actionLabel="Choose file"
            onAction={() => handleImport('restore')}
            loading={busyAction === 'import:restore'}
            accent
          />
        </div>
      </section>

      <section className="settings-section">
        <h2>About</h2>
        <div className="card" style={{ maxWidth: 520 }}>
          <table style={{ width: '100%', fontSize: 13 }}>
            <tbody>
              <tr><td style={{ color: 'var(--text-muted)', padding: '5px 0', paddingRight: 16 }}>App</td><td>ReptiLogic</td></tr>
              <tr><td style={{ color: 'var(--text-muted)', padding: '5px 0', paddingRight: 16 }}>Version</td><td>1.0.0</td></tr>
              <tr><td style={{ color: 'var(--text-muted)', padding: '5px 0', paddingRight: 16 }}>Ball python morphs</td><td>130+ genes in database</td></tr>
              <tr><td style={{ color: 'var(--text-muted)', padding: '5px 0', paddingRight: 16 }}>Hognose morphs</td><td>25+ genes in database</td></tr>
              <tr><td style={{ color: 'var(--text-muted)', padding: '5px 0', paddingRight: 16 }}>Species supported</td><td>10 (more via migration)</td></tr>
              <tr><td style={{ color: 'var(--text-muted)', padding: '5px 0', paddingRight: 16 }}>Data storage</td><td>Local SQLite database</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ResultBanner({ result }) {
  if (!result) return null

  return (
    <div className={`settings-result ${result.success ? 'settings-result-success' : 'settings-result-error'}`}>
      <div>{result.success ? '✓' : '✗'} {result.message}</div>
      {result.errors?.length > 0 && (
        <ul className="settings-result-errors">
          {result.errors.slice(0, 8).map(error => <li key={error}>{error}</li>)}
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
        onClick={onAction}
        disabled={loading}
        style={{ alignSelf: 'flex-start' }}
      >
        {loading ? 'Working…' : actionLabel}
      </button>
    </div>
  )
}
