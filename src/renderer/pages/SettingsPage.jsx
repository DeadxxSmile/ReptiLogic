import React, { useState, useEffect } from 'react'
import { useAsync } from '../hooks/useData'
import { LoadingSpinner } from '../components/shared'
import './SettingsPage.css'
import '../components/FirstRunModal.css'

export default function SettingsPage() {
  const { data: settings, loading, refetch } = useAsync(() => window.api.settings.getAll(), [])
  const { data: morphCount } = useAsync(() => window.api.morphs.getCount(), [])
  const [saved, setSaved] = useState(false)

  // ── Light mode ──────────────────────────────────────────────────────────────
  const [lightMode, setLightMode] = useState(() => document.body.classList.contains('light-mode'))
  const toggleLightMode = async (val) => {
    document.body.classList.toggle('light-mode', val)
    setLightMode(val)
    await window.api.settings.set('light_mode', val ? '1' : '0')
  }
  useEffect(() => {
    if (settings?.light_mode === '1') { document.body.classList.add('light-mode'); setLightMode(true) }
    else { document.body.classList.remove('light-mode'); setLightMode(false) }
  }, [settings?.light_mode])

  // ── Database path ────────────────────────────────────────────────────────────
  const [dbPath,       setDbPath]       = useState(null)
  const [dbMoving,     setDbMoving]     = useState(false)
  const [dbMoveResult, setDbMoveResult] = useState(null)
  useEffect(() => { window.api.db.getPath().then(setDbPath) }, [])
  const handleChangeDbLocation = async () => {
    setDbMoving(true); setDbMoveResult(null)
    try {
      const folder = await window.api.db.chooseFolder()
      if (!folder) { setDbMoving(false); return }
      const result = await window.api.db.setPath(folder)
      if (result.unchanged) { setDbMoveResult({ success: true, message: 'Database is already stored there.' }); setDbMoving(false); return }
      if (!result.success)  { setDbMoveResult({ success: false, message: result.error }); setDbMoving(false); return }
      setDbMoveResult({
        success: true, warning: result.existedAtDestination,
        message: result.existedAtDestination
          ? `Database copied to ${result.path}. An existing database was found there. Restart the app to load from the new location.`
          : `Database copied to ${result.path}. Restart the app to load from the new location.`,
      })
      setDbPath(result.path)
    } catch (e) {
      setDbMoveResult({ success: false, message: e.message || 'Failed to move database.' })
    } finally { setDbMoving(false) }
  }

  // ── Settings setter ──────────────────────────────────────────────────────────
  const setSetting = async (key, value) => {
    if (!settings) return
    await window.api.settings.set(key, value)
    await refetch().catch(() => {})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── Breeder profile — local state to avoid scroll-on-type ────────────────────
  const [breederName,      setBreederName]      = useState('')
  const [breederWebsite,   setBreederWebsite]   = useState('')
  const [breederInstagram, setBreederInstagram] = useState('')
  const [breederFacebook,  setBreederFacebook]  = useState('')
  const [breederX,         setBreederX]         = useState('')
  const [breederYoutube,   setBreederYoutube]   = useState('')
  const [breederTiktok,    setBreederTiktok]    = useState('')
  const [logoDataUrl,      setLogoDataUrl]      = useState(null)
  const [breederSaved,     setBreederSaved]     = useState(false)

  // Populate local state once settings load
  useEffect(() => {
    if (!settings) return
    setBreederName(settings.breeder_name || '')
    setBreederWebsite(settings.breeder_website || '')
    setBreederInstagram(settings.breeder_instagram || '')
    setBreederFacebook(settings.breeder_facebook || '')
    setBreederX(settings.breeder_x || '')
    setBreederYoutube(settings.breeder_youtube || '')
    setBreederTiktok(settings.breeder_tiktok || '')
  }, [!!settings]) // run once when settings first load

  // Load logo preview
  useEffect(() => {
    if (settings?.breeder_logo_path) {
      window.api.print.getLogoDataUrl().then(url => { if (url) setLogoDataUrl(url) }).catch(() => {})
    }
  }, [settings?.breeder_logo_path])

  const saveBreederProfile = async () => {
    await window.api.settings.set('breeder_name',      breederName)
    await window.api.settings.set('breeder_website',   breederWebsite)
    await window.api.settings.set('breeder_instagram', breederInstagram)
    await window.api.settings.set('breeder_facebook',  breederFacebook)
    await window.api.settings.set('breeder_x',         breederX)
    await window.api.settings.set('breeder_youtube',   breederYoutube)
    await window.api.settings.set('breeder_tiktok',    breederTiktok)
    await refetch().catch(() => {})
    setBreederSaved(true)
    setTimeout(() => setBreederSaved(false), 2500)
  }

  const handleChooseLogo = async () => {
    const p = await window.api.print.chooseLogo()
    if (p) {
      await window.api.settings.set('breeder_logo_path', p)
      const url = await window.api.print.getLogoDataUrl().catch(() => null)
      if (url) setLogoDataUrl(url)
    }
  }

  // ── Modal states ─────────────────────────────────────────────────────────────
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showBackup, setShowBackup] = useState(false)

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
          <div className="settings-row-label"><span>Appearance</span><span className="settings-row-sub">Switch between dark and light mode</span></div>
          <div className="filter-group">
            <button className={`filter-btn ${!lightMode ? 'active' : ''}`} onClick={() => toggleLightMode(false)}>🌙 Dark</button>
            <button className={`filter-btn ${lightMode ? 'active' : ''}`} onClick={() => toggleLightMode(true)}>☀️ Light</button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label"><span>Temperature unit</span><span className="settings-row-sub">Used for incubation temperatures</span></div>
          <div className="filter-group">
            {[['fahrenheit','°F'],['celsius','°C']].map(([val,label]) => (
              <button key={val} className={`filter-btn ${settings?.temp_unit === val ? 'active' : ''}`} onClick={() => setSetting('temp_unit', val)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label"><span>Weight unit</span><span className="settings-row-sub">Used throughout the app</span></div>
          <div className="filter-group">
            {[['grams','Grams'],['ounces','Ounces']].map(([val,label]) => (
              <button key={val} className={`filter-btn ${settings?.weight_unit === val ? 'active' : ''}`} onClick={() => setSetting('weight_unit', val)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label"><span>Default species</span><span className="settings-row-sub">Pre-selected when adding an animal</span></div>
          <select className="form-select" style={{ width: 180 }} value={settings?.default_species || 'ball_python'} onChange={e => setSetting('default_species', e.target.value)}>
            <option value="ball_python">Ball Python</option>
            <option value="western_hognose">Western Hognose</option>
            <option value="corn_snake">Corn Snake</option>
            <option value="boa_constrictor">Boa Constrictor</option>
            <option value="carpet_python">Carpet Python</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-row-label"><span>Animal ID mode</span><span className="settings-row-sub">How IDs are assigned to new animals by default</span></div>
          <div className="filter-group">
            {[['auto','⚡ Auto-generate'],['manual','✏️ Manual']].map(([val,label]) => (
              <button key={val} className={`filter-btn ${(settings?.animal_id_mode || 'auto') === val ? 'active' : ''}`} onClick={() => setSetting('animal_id_mode', val)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label"><span>Feeding reminder</span><span className="settings-row-sub">Days before showing a feeding reminder on the dashboard</span></div>
          <select className="form-select" style={{ width: 140 }} value={settings?.feeding_reminder_days || '14'} onChange={e => setSetting('feeding_reminder_days', e.target.value)}>
            {[7,10,14,21,28].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-row-label"><span>Weighing reminder</span><span className="settings-row-sub">Days before showing a weight reminder on the dashboard</span></div>
          <select className="form-select" style={{ width: 140 }} value={settings?.weighing_reminder_days || '30'} onChange={e => setSetting('weighing_reminder_days', e.target.value)}>
            {[14,21,30,45,60,90].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
      </section>

      {/* ── Breeder profile ──────────────────────────────────── */}
      <section className="settings-section">
        <h2>Breeder profile</h2>
        <p className="settings-helper-copy">Used in husbandry print reports. Your name, logo, and links appear at the top of each document.</p>

        {/* Logo + name row */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Logo preview / picker */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 100, height: 100, borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--border)', background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', cursor: 'pointer', position: 'relative',
            }} onClick={handleChooseLogo} title="Click to choose logo">
              {logoDataUrl
                ? <img src={logoDataUrl} alt="Breeder logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, padding: 8 }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🖼️</div>
                    Click to add logo
                  </div>
              }
            </div>
            {logoDataUrl && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, fontSize: 11, width: '100%' }} onClick={handleChooseLogo}>
                Change
              </button>
            )}
          </div>

          {/* Name + website */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Breeder / business name</label>
              <input className="form-input" value={breederName}
                onChange={e => setBreederName(e.target.value)}
                placeholder="e.g. Sunset Reptiles LLC" />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={breederWebsite}
                onChange={e => setBreederWebsite(e.target.value)}
                placeholder="https://yoursite.com" />
            </div>
          </div>
        </div>

        {/* Socials grid */}
        <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
          {[
            ['📸', 'Instagram', breederInstagram, setBreederInstagram, '@yourhandle'],
            ['📘', 'Facebook',  breederFacebook,  setBreederFacebook,  'Page name or URL'],
            ['𝕏',  'X / Twitter', breederX,       setBreederX,         '@yourhandle'],
            ['▶',  'YouTube',   breederYoutube,   setBreederYoutube,   'Channel name or URL'],
            ['🎵', 'TikTok',    breederTiktok,    setBreederTiktok,    '@yourhandle'],
          ].map(([icon, label, val, setter, placeholder]) => (
            <div key={label} className="form-group">
              <label className="form-label">{icon} {label}</label>
              <input className="form-input" value={val}
                onChange={e => setter(e.target.value)}
                placeholder={placeholder} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary btn-sm" onClick={saveBreederProfile}>
            💾 Save profile
          </button>
          {breederSaved && <span style={{ color: 'var(--accent-text)', fontSize: 13 }}>✓ Saved</span>}
        </div>
      </section>

      {/* ── Database location ────────────────────────────────── */}
      <section className="settings-section">
        <h2>Database location</h2>
        <p className="settings-helper-copy">Move your database to a synced folder like OneDrive or Dropbox. ReptiLogic creates a <code>ReptiLogic/</code> subfolder. Restart required after moving.</p>
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: '100%' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="settings-row-label">
                <span>Current location</span>
                <span className="settings-row-sub" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, wordBreak: 'break-all', marginTop: 4, color: 'var(--text-secondary)' }}>
                  {dbPath || '—'}
                </span>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleChangeDbLocation} disabled={dbMoving}>
              {dbMoving ? '⏳ Moving…' : '📂 Change location'}
            </button>
          </div>
          {dbMoveResult && (
            <div style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13,
              background: dbMoveResult.success ? (dbMoveResult.warning ? 'var(--amber-dim)' : 'var(--accent-dim)') : 'var(--red-dim)',
              color: dbMoveResult.success ? (dbMoveResult.warning ? 'var(--amber-text)' : 'var(--accent-text)') : 'var(--red-text)',
              border: `1px solid ${dbMoveResult.success ? (dbMoveResult.warning ? 'var(--amber)' : 'var(--accent)') : 'var(--red)'}`,
            }}>
              {dbMoveResult.success ? (dbMoveResult.warning ? '⚠ ' : '✓ ') : '✗ '}{dbMoveResult.message}
            </div>
          )}
        </div>
      </section>

      {/* ── Data management ──────────────────────────────────── */}
      <section className="settings-section">
        <h2>Data management</h2>
        <p className="settings-helper-copy">Export your data, import records, or manage automated backups.</p>
        <div className="data-mgmt-row">
          <DataCard icon="📤" title="Export" desc="Collection, breeding & morphs CSV" onClick={() => setShowExport(true)} />
          <DataCard icon="📥" title="Import" desc="Any ReptiLogic file or backup" onClick={() => setShowImport(true)} />
          <DataCard icon="💾" title="Backup" desc="Auto backups, force run, restore" onClick={() => setShowBackup(true)} accent />
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────── */}
      <section className="settings-section">
        <h2>About</h2>
        <div className="about-panel">
          <div className="about-logo-wrap">
            <img src="./logo.png" alt="ReptiLogic" className="about-logo-large" />
          </div>
          <div className="about-info-card card">
            <table className="about-table">
              <tbody>
                <AboutRow label="App"               value="ReptiLogic" />
                <AboutRow label="Version"           value="1.1.2" />
                <AboutRow label="Author"            value="Deadx_xSmile" />
                <AboutRow label="Source"            value={
                  <a href="https://github.com/DeadxxSmile/ReptiLogic" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent-text)' }}>github.com/DeadxxSmile/ReptiLogic</a>
                } />
                <AboutRow label="Total morphs"      value={morphCount ? `${morphCount.total} in database` : '—'} />
                <AboutRow label="Species supported" value="10+ (more via library)" />
                <AboutRow label="Data storage"      value="Local SQLite database" />
                <AboutRow label="License"           value="GPL-3.0" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Modals ───────────────────────────────────────────── */}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showBackup && <BackupModal settings={settings} onClose={() => setShowBackup(false)} onSaved={refetch} />}
    </div>
  )
}

// ── Export Modal ──────────────────────────────────────────────────────────────
// ── Reusable modal shell ──────────────────────────────────────────────────────

function Modal({ title, subtitle, icon, onClose, children, wide }) {
  return (
    <div className="frm-overlay">
      <div className={`frm-modal ${wide ? 'frm-modal--wide' : ''}`} style={{ maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {icon && <span style={{ fontSize: 32, lineHeight: 1 }}>{icon}</span>}
            <div>
              <h2 className="frm-title" style={{ marginBottom: 2 }}>{title}</h2>
              {subtitle && <p className="frm-sub" style={{ margin: 0, fontSize: 13 }}>{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: '2px 4px', borderRadius: 4, flexShrink: 0 }}
          >✕</button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

// ── Export Modal ──────────────────────────────────────────────────────────────
function ExportModal({ onClose }) {
  const [busy,   setBusy]   = useState(null)
  const [result, setResult] = useState(null)

  const run = async (type) => {
    setBusy(type); setResult(null)
    try {
      const folder = await window.api.export.chooseFolder()
      if (!folder) { setBusy(null); return }
      let res
      if (type === 'collection') res = await window.api.export.collectionCsv(folder)
      if (type === 'breeding')   res = await window.api.export.breedingCsv(folder)
      if (type === 'morphs')     res = await window.api.export.morphsCsv(folder)
      if (type === 'template')   res = await window.api.export.importTemplateCsv(folder)
      setResult({ success: true, message: `Exported to: ${res?.path}${res?.count != null ? ` (${res.count} records)` : ''}` })
    } catch (e) {
      setResult({ success: false, message: e.message })
    } finally { setBusy(null) }
  }

  const EXPORTS = [
    { type: 'collection', icon: '🐍', title: 'Collection CSV',   desc: 'All animals with morphs, weights, dates, and notes.' },
    { type: 'breeding',   icon: '🥚', title: 'Breeding CSV',     desc: 'All pairing records with dates, egg counts, and hatch totals.' },
    { type: 'morphs',     icon: '🧬', title: 'Morphs CSV',       desc: 'All morphs including user-created ones.' },
    { type: 'template',   icon: '📄', title: 'Import template',  desc: 'Blank starter CSV for bulk importing animals into ReptiLogic.' },
  ]

  return (
    <Modal title="Export data" icon="📤" subtitle="Each option saves a CSV file to a folder you choose." onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EXPORTS.map(({ type, icon, title, desc }) => (
          <div key={type} className="frm-db-option" style={{ cursor: 'default', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>{icon}</span>
              <div>
                <div className="frm-db-option-title">{title}</div>
                <div className="frm-db-option-desc">{desc}</div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => run(type)} disabled={busy === type} style={{ flexShrink: 0 }}>
              {busy === type ? '⏳' : 'Export →'}
            </button>
          </div>
        ))}
      </div>
      {result && <ResultBanner result={result} style={{ marginTop: 14 }} />}
      <div className="frm-actions" style={{ marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  )
}

// ── Import Modal ──────────────────────────────────────────────────────────────
function ImportModal({ onClose }) {
  const [busy,   setBusy]   = useState(false)
  const [result, setResult] = useState(null)

  const run = async () => {
    setBusy(true); setResult(null)
    try {
      const file = await window.api.importData.chooseImportFile()
      if (!file) { setBusy(false); return }
      const res = await window.api.importData.restoreAny(file)
      const imported = res.imported != null ? ` (${res.imported} records)` : ''
      setResult({ success: res.success !== false, message: `${res.message || 'Import completed.'}${imported}`, errors: res.errors })
    } catch (e) {
      setResult({ success: false, message: e.message })
    } finally { setBusy(false) }
  }

  return (
    <Modal title="Import data" icon="📥" subtitle="Select any file exported by ReptiLogic. The app detects the format automatically." onClose={onClose}>
      <div className="frm-db-options" style={{ marginBottom: 0 }}>
        <div className="frm-db-option frm-db-option--cloud">
          <div className="frm-db-option-icon">📂</div>
          <div>
            <div className="frm-db-option-title">Collection CSV, Breeding CSV, or Morph CSV</div>
            <div className="frm-db-option-desc">Merges records into your existing database.</div>
          </div>
        </div>
        <div className="frm-db-option frm-db-option--default">
          <div className="frm-db-option-icon">💾</div>
          <div>
            <div className="frm-db-option-title">Full backup (.zip or .db)</div>
            <div className="frm-db-option-desc">Replaces the entire database. Use this to restore a backup.</div>
          </div>
        </div>
      </div>
      {result && <ResultBanner result={result} style={{ marginTop: 14 }} />}
      <div className="frm-actions" style={{ marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-lg" onClick={run} disabled={busy}>
          {busy ? '⏳ Importing…' : '📂 Choose file to import'}
        </button>
      </div>
    </Modal>
  )
}

// ── Backup Modal ──────────────────────────────────────────────────────────────
function BackupModal({ settings: initialSettings, onClose, onSaved }) {
  const [enabled,   setEnabled]   = useState(initialSettings?.backup_enabled === '1')
  const [folder,    setFolder]    = useState(initialSettings?.backup_folder || '')
  const [trigger,   setTrigger]   = useState(initialSettings?.backup_trigger || 'on_close')
  const [keepCount, setKeepCount] = useState(initialSettings?.backup_keep_count || '10')
  const [busy,      setBusy]      = useState(null)
  const [result,    setResult]    = useState(null)
  const [backups,   setBackups]   = useState([])
  const [restoring, setRestoring] = useState(null)
  const [showList,  setShowList]  = useState(false)

  useEffect(() => {
    if (folder) window.api.backup.list(folder).then(b => { setBackups(b); setShowList(true) }).catch(() => {})
  }, [folder])

  const chooseFolder = async () => {
    const f = await window.api.backup.chooseFolder()
    if (f) { setFolder(f); window.api.backup.list(f).then(b => { setBackups(b); setShowList(true) }).catch(() => {}) }
  }

  const saveSettings = async () => {
    await window.api.settings.set('backup_enabled',    enabled ? '1' : '0')
    await window.api.settings.set('backup_folder',     folder)
    await window.api.settings.set('backup_trigger',    trigger)
    await window.api.settings.set('backup_keep_count', keepCount)
    onSaved()
    setResult({ success: true, message: 'Backup settings saved.' })
  }

  const runNow = async () => {
    if (!folder) { setResult({ success: false, message: 'Choose a backup folder first.' }); return }
    setBusy('run'); setResult(null)
    try {
      const res = await window.api.backup.runToFolder(folder)
      if (res.success) {
        setResult({ success: true, message: `Backup saved to: ${res.path}` })
        window.api.backup.list(folder).then(setBackups).catch(() => {})
      } else {
        setResult({ success: false, message: res.error })
      }
    } catch (e) {
      setResult({ success: false, message: e.message })
    } finally { setBusy(null) }
  }

  const restore = async (path) => {
    if (!window.confirm('Restore this backup? Your current data will be replaced. The app will need to restart.')) return
    setRestoring(path); setResult(null)
    try {
      const res = await window.api.backup.restore(path)
      if (res.success) setResult({ success: true, message: 'Restore complete. Please restart the app.' })
      else setResult({ success: false, message: res.error })
    } catch (e) {
      setResult({ success: false, message: e.message })
    } finally { setRestoring(null) }
  }

  const chooseAndRestore = async () => {
    const file = await window.api.backup.chooseFile()
    if (file) restore(file)
  }

  function fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <Modal title="Backup & restore" icon="💾" subtitle="Protect your data with automatic compressed backups." onClose={onClose} wide>
      {/* Auto-backup toggle */}
      <div className="frm-backup-toggle" style={{ marginBottom: 16 }}>
        <label className="frm-toggle-row">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <span>Enable automatic backups</span>
        </label>
      </div>

      {/* Config grid */}
      <div className="frm-backup-config" style={{ marginBottom: 20 }}>
        <div className="frm-backup-row">
          <span className="frm-backup-label">Backup folder</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
              {folder || 'No folder chosen'}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={chooseFolder}>📂 Choose</button>
          </div>
        </div>
        <div className="frm-backup-row">
          <span className="frm-backup-label">Run backup</span>
          <select className="form-select" style={{ width: 180 }} value={trigger} onChange={e => setTrigger(e.target.value)}>
            <option value="on_close">When app closes</option>
            <option value="on_open">When app opens</option>
          </select>
        </div>
        <div className="frm-backup-row">
          <span className="frm-backup-label">Keep backups</span>
          <select className="form-select" style={{ width: 180 }} value={keepCount} onChange={e => setKeepCount(e.target.value)}>
            {[3,5,10,20,30,50].map(n => <option key={n} value={n}>{n} backups</option>)}
          </select>
        </div>
      </div>

      {/* Saved backups list */}
      {showList && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Saved backups {backups.length > 0 && `(${backups.length})`}
          </div>
          {backups.length === 0
            ? <p className="frm-sub" style={{ margin: 0 }}>No backups found in that folder yet.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {backups.map(b => (
                  <div key={b.path} className="frm-db-option" style={{ cursor: 'default', justifyContent: 'space-between', padding: '10px 14px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>
                        {b.filename.replace('reptilogic-backup-', '').replace('.zip', '')}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtSize(b.size)}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}
                      disabled={restoring === b.path} onClick={() => restore(b.path)}>
                      {restoring === b.path ? '⏳' : '↩ Restore'}
                    </button>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {result && <ResultBanner result={result} style={{ marginBottom: 14 }} />}

      <div className="frm-actions">
        <button className="btn btn-ghost btn-sm" onClick={chooseAndRestore}>📂 Restore from file</button>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button className="btn btn-secondary" onClick={runNow} disabled={busy === 'run'}>
            {busy === 'run' ? '⏳ Backing up…' : '⚡ Backup now'}
          </button>
          <button className="btn btn-primary" onClick={saveSettings}>💾 Save settings</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function DataCard({ icon, title, desc, onClick, accent }) {
  return (
    <button className={`data-mgmt-card ${accent ? 'data-mgmt-card--accent' : ''}`} onClick={onClick}>
      <span className="data-mgmt-icon">{icon}</span>
      <span className="data-mgmt-title">{title}</span>
      <span className="data-mgmt-desc">{desc}</span>
    </button>
  )
}

function ResultBanner({ result, style }) {
  if (!result) return null
  return (
    <div className={`settings-result ${result.success ? 'settings-result-success' : 'settings-result-error'}`} style={style}>
      <div>{result.success ? '✓' : '✗'} {result.message}</div>
      {result.errors?.length > 0 && (
        <ul className="settings-result-errors">
          {result.errors.slice(0, 8).map(e => <li key={e}>{e}</li>)}
          {result.errors.length > 8 && <li>…and {result.errors.length - 8} more.</li>}
        </ul>
      )}
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
