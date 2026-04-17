import React, { useState } from 'react'
import './FirstRunModal.css'

const STEPS = ['welcome', 'features', 'database', 'backup', 'done']

export default function FirstRunModal({ onComplete }) {
  const [step,     setStep]     = useState(0)
  const [choosing, setChoosing] = useState(false)
  const [dbResult, setDbResult] = useState(null)
  const [dbPath,   setDbPath]   = useState(null)

  // Backup step state
  const [backupEnabled,  setBackupEnabled]  = useState(false)
  const [backupFolder,   setBackupFolder]   = useState('')
  const [backupTrigger,  setBackupTrigger]  = useState('on_close')
  const [backupKeep,     setBackupKeep]     = useState('10')
  const [backupSaving,   setBackupSaving]   = useState(false)
  const [backupResult,   setBackupResult]   = useState(null)

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  const handleChooseLocation = async () => {
    setChoosing(true); setDbResult(null)
    try {
      const folder = await window.api.db.chooseFolder()
      if (!folder) { setChoosing(false); return }
      const result = await window.api.db.setPath(folder)
      if (!result.success) { setDbResult({ success: false, message: result.error }); setChoosing(false); return }
      setDbResult({
        success: true,
        warning: result.existedAtDestination,
        message: result.existedAtDestination
          ? `Existing database found. Your data has been written to: ${result.path}`
          : `Database will be stored at:\n${result.path}`,
      })
      setDbPath(result.path)
    } catch (e) {
      setDbResult({ success: false, message: e.message })
    } finally { setChoosing(false) }
  }

  const handleChooseBackupFolder = async () => {
    setBackupSaving(true); setBackupResult(null)
    try {
      const folder = await window.api.backup.chooseFolder()
      if (folder) { setBackupFolder(folder); setBackupEnabled(true) }
    } finally { setBackupSaving(false) }
  }

  const handleFinish = async () => {
    if (backupEnabled && backupFolder) {
      await window.api.settings.set('backup_enabled',    '1')
      await window.api.settings.set('backup_folder',     backupFolder)
      await window.api.settings.set('backup_trigger',    backupTrigger)
      await window.api.settings.set('backup_keep_count', backupKeep)
    }
    await window.api.db.markNotFirstRun().catch(() => {})
    onComplete()
  }

  return (
    <div className="frm-overlay">
      <div className="frm-modal">

        {/* Step dots */}
        <div className="frm-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`frm-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        {/* ── Step 0: Welcome ─────────────────────────────────── */}
        {step === 0 && (
          <div className="frm-step">
            <div className="frm-logo-wrap">
              <img src="./logo.png" alt="ReptiLogic" className="frm-logo" />
            </div>
            <h1 className="frm-title">Welcome to ReptiLogic</h1>
            <p className="frm-sub">
              Your personal reptile collection and breeding manager. Everything stays on your machine — no accounts, no subscriptions, no cloud required.
            </p>
            <p className="frm-sub">
              This quick guide walks you through what the app can do and helps you get set up in about two minutes.
            </p>
            <div className="frm-actions">
              <button className="btn btn-primary btn-lg" onClick={next}>Get started →</button>
            </div>
          </div>
        )}

        {/* ── Step 1: Features ────────────────────────────────── */}
        {step === 1 && (
          <div className="frm-step">
            <h2 className="frm-title">What's inside</h2>
            <div className="frm-feature-grid">
              {[
                { icon: '🐍', title: 'Collection',       desc: 'Track every animal with photos, morphs, weights, Animal IDs, and full lineage.' },
                { icon: '🏥', title: 'Health',           desc: 'Log health issues, medications, vet visits, and weight trends.' },
                { icon: '🥚', title: 'Breeding',         desc: 'Manage pairings, clutches, and add hatchlings directly to your collection.' },
                { icon: '🧬', title: 'Genetics Calc',    desc: 'Calculate offspring odds for any gene combination across all inheritance types.' },
                { icon: '📖', title: 'Animal Library',   desc: 'Built-in species + morphs library. Add custom species and morphs too.' },
                { icon: '🖨️', title: 'Husbandry Docs',  desc: 'Print professional animal records with lineage, feeding history, and your logo.' },
              ].map(f => (
                <div key={f.title} className="frm-feature">
                  <span className="frm-feature-icon">{f.icon}</span>
                  <div>
                    <div className="frm-feature-title">{f.title}</div>
                    <div className="frm-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="frm-actions">
              <button className="btn btn-ghost" onClick={back}>← Back</button>
              <button className="btn btn-primary btn-lg" onClick={next}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Database ────────────────────────────────── */}
        {step === 2 && (
          <div className="frm-step">
            <h2 className="frm-title">Where should your data live?</h2>
            <p className="frm-sub">
              By default your database is stored in your local app data folder. Optionally move it to a cloud-synced folder like <strong>OneDrive</strong>, <strong>Google Drive</strong>, or <strong>Dropbox</strong> for a live backup across PCs.
            </p>
            <div className="frm-db-options">
              <div className="frm-db-option frm-db-option--default">
                <div className="frm-db-option-icon">🖥️</div>
                <div>
                  <div className="frm-db-option-title">Keep default location</div>
                  <div className="frm-db-option-desc">Stored locally in AppData. Fast and private.</div>
                </div>
              </div>
              <div className="frm-db-option frm-db-option--cloud">
                <div className="frm-db-option-icon">☁️</div>
                <div>
                  <div className="frm-db-option-title">Use a cloud folder</div>
                  <div className="frm-db-option-desc">Choose OneDrive, Google Drive, or Dropbox. ReptiLogic creates a <code>ReptiLogic/</code> subfolder there.</div>
                </div>
              </div>
            </div>
            {dbResult && (
              <div className={`frm-db-result ${dbResult.success ? (dbResult.warning ? 'warning' : 'success') : 'error'}`}>
                {dbResult.success ? (dbResult.warning ? '⚠ ' : '✓ ') : '✗ '}{dbResult.message}
              </div>
            )}
            <div className="frm-actions">
              <button className="btn btn-ghost" onClick={back}>← Back</button>
              {!dbPath && (
                <button className="btn btn-secondary" onClick={handleChooseLocation} disabled={choosing}>
                  {choosing ? '⏳ Setting up…' : '📂 Choose cloud folder'}
                </button>
              )}
              <button className="btn btn-primary btn-lg" onClick={next}>
                {dbPath ? 'Continue →' : 'Keep default & continue →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Backups ─────────────────────────────────── */}
        {step === 3 && (
          <div className="frm-step">
            <h2 className="frm-title">Automatic backups</h2>
            <p className="frm-sub">
              ReptiLogic can automatically save a compressed database backup to a folder of your choice — great for extra peace of mind or offsite storage.
            </p>

            <div className="frm-backup-toggle">
              <label className="frm-toggle-row">
                <input type="checkbox" checked={backupEnabled} onChange={e => setBackupEnabled(e.target.checked)} />
                <span>Enable automatic backups</span>
              </label>
            </div>

            {backupEnabled && (
              <div className="frm-backup-config">
                <div className="frm-backup-row">
                  <span className="frm-backup-label">Backup folder</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                      {backupFolder || 'No folder chosen'}
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={handleChooseBackupFolder} disabled={backupSaving}>
                      📂 Choose
                    </button>
                  </div>
                </div>

                <div className="frm-backup-row">
                  <span className="frm-backup-label">Run backup</span>
                  <select className="form-select" style={{ width: 160 }} value={backupTrigger} onChange={e => setBackupTrigger(e.target.value)}>
                    <option value="on_close">When app closes</option>
                    <option value="on_open">When app opens</option>
                  </select>
                </div>

                <div className="frm-backup-row">
                  <span className="frm-backup-label">Keep backups</span>
                  <select className="form-select" style={{ width: 160 }} value={backupKeep} onChange={e => setBackupKeep(e.target.value)}>
                    {[3, 5, 10, 20, 30, 50].map(n => <option key={n} value={n}>{n} backups</option>)}
                  </select>
                </div>
              </div>
            )}

            {!backupEnabled && (
              <p className="frm-sub" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                You can set this up later under <strong>Settings → Backup</strong>.
              </p>
            )}

            <div className="frm-actions">
              <button className="btn btn-ghost" onClick={back}>← Back</button>
              <button className="btn btn-primary btn-lg" onClick={next}>
                {backupEnabled && backupFolder ? 'Save & continue →' : 'Skip & continue →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ─────────────────────────────────────── */}
        {step === 4 && (
          <div className="frm-step frm-step--center">
            <div className="frm-done-icon">🎉</div>
            <h2 className="frm-title">You're all set!</h2>
            <p className="frm-sub">
              Head to <strong>Collection</strong> to add your first animal, or check out the <strong>Animal Library</strong> to explore the species and morph database.
            </p>
            <p className="frm-sub" style={{ fontSize: 13 }}>
              Change any of these settings later under <strong>Settings → Preferences</strong>.
            </p>
            <div className="frm-actions">
              <button className="btn btn-primary btn-lg" onClick={handleFinish}>
                Open ReptiLogic 🐍
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
