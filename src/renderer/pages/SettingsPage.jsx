import React, { useState, useEffect } from 'react'
import { useAsync } from '../hooks/useData'
import { LoadingSpinner, StatTile } from '../components/shared'
import './SettingsPage.css'

export default function SettingsPage() {
  const { data: settings, loading, refetch } = useAsync(() => window.api.settings.getAll(), [])
  const [saved,   setSaved]   = useState(false)
  const [exporting, setExporting] = useState(null)
  const [exportResult, setExportResult] = useState(null)

  const setSetting = async (key, value) => {
    if (!settings) return

    await window.api.settings.set(key, value)
    await refetch().catch(() => {})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = async (type) => {
    setExporting(type)
    setExportResult(null)
    try {
      const folder = await window.api.export.chooseFolder()
      if (!folder) { setExporting(null); return }

      let result
      if (type === 'collection') result = await window.api.export.collectionCsv(folder)
      else if (type === 'breeding') result = await window.api.export.breedingCsv(folder)
      else if (type === 'backup')   result = await window.api.export.fullBackup(folder)

      setExportResult({ type, ...result })
    } catch (e) {
      setExportResult({ type, success: false, error: e.message })
    } finally {
      setExporting(null)
    }
  }

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
            <span>Temperature unit</span>
            <span className="settings-row-sub">Used for incubation temperatures</span>
          </div>
          <div className="filter-group">
            {[['fahrenheit','°F'],['celsius','°C']].map(([val, label]) => (
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
            {[['grams','Grams'],['ounces','Ounces']].map(([val, label]) => (
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
            className="form-select"
            style={{ width: 200 }}
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
            <span className="settings-row-sub">Days before showing a feeding reminder on dashboard</span>
          </div>
          <select
            className="form-select"
            style={{ width: 120 }}
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
            <span className="settings-row-sub">Days before showing a weight reminder on dashboard</span>
          </div>
          <select
            className="form-select"
            style={{ width: 120 }}
            value={settings?.weighing_reminder_days || '30'}
            onChange={e => setSetting('weighing_reminder_days', e.target.value)}
          >
            {[14, 21, 30, 45, 60, 90].map(d => (
              <option key={d} value={d}>{d} days</option>
            ))}
          </select>
        </div>
      </section>

      {/* ── Export ──────────────────────────────────────────── */}
      <section className="settings-section">
        <h2>Export data</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Export your data as CSV files or create a full database backup.
          CSV files open in Excel, Google Sheets, or any spreadsheet app.
        </p>

        {exportResult && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
            fontSize: 13,
            background: exportResult.success ? 'var(--accent-dim)' : 'var(--red-dim)',
            color:      exportResult.success ? 'var(--accent-text)' : 'var(--red-text)',
            border:     `1px solid ${exportResult.success ? 'var(--accent)' : 'var(--red)'}`,
          }}>
            {exportResult.success
              ? `✓ Exported to: ${exportResult.path}${exportResult.count != null ? ` (${exportResult.count} records)` : ''}`
              : `✗ Export failed: ${exportResult.error}`
            }
          </div>
        )}

        <div className="export-cards">
          <ExportCard
            title="Collection CSV"
            description="All animals with morphs, weights, dates, and notes."
            icon="🐍"
            onExport={() => handleExport('collection')}
            loading={exporting === 'collection'}
          />
          <ExportCard
            title="Breeding records CSV"
            description="All pairing records with dates, egg counts, and hatch data."
            icon="🥚"
            onExport={() => handleExport('breeding')}
            loading={exporting === 'breeding'}
          />
          <ExportCard
            title="Full database backup"
            description="Complete .db backup file. Restores everything — animals, photos references, all records."
            icon="💾"
            onExport={() => handleExport('backup')}
            loading={exporting === 'backup'}
            accent
          />
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────── */}
      <section className="settings-section">
        <h2>About</h2>
        <div className="card" style={{ maxWidth: 480 }}>
          <table style={{ width: '100%', fontSize: 13 }}>
            <tbody>
              <tr><td style={{ color: 'var(--text-muted)', padding: '5px 0', paddingRight: 16 }}>App</td><td>ReptiLogic</td></tr>
              <tr><td style={{ color: 'var(--text-muted)', padding: '5px 0', paddingRight: 16 }}>Version</td><td>0.1.0</td></tr>
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

function ExportCard({ title, description, icon, onExport, loading, accent }) {
  return (
    <div className={`export-card ${accent ? 'export-card-accent' : ''}`}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <h3 style={{ marginBottom: 4, fontSize: 14 }}>{title}</h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, flex: 1 }}>{description}</p>
      <button
        className={`btn ${accent ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        onClick={onExport}
        disabled={loading}
        style={{ alignSelf: 'flex-start' }}
      >
        {loading ? 'Exporting…' : 'Export'}
      </button>
    </div>
  )
}
