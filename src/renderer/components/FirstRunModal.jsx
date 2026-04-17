import React, { useState } from 'react'
import './FirstRunModal.css'

const STEPS = ['welcome', 'features', 'database', 'done']

export default function FirstRunModal({ onComplete }) {
  const [step,     setStep]     = useState(0)
  const [choosing, setChoosing] = useState(false)
  const [dbResult, setDbResult] = useState(null)
  const [dbPath,   setDbPath]   = useState(null)

  const next = () => setStep(s => s + 1)

  const handleChooseLocation = async () => {
    setChoosing(true)
    setDbResult(null)
    try {
      const folder = await window.api.db.chooseFolder()
      if (!folder) { setChoosing(false); return }

      const result = await window.api.db.setPath(folder)

      if (!result.success) {
        setDbResult({ success: false, message: result.error })
        setChoosing(false)
        return
      }

      if (result.existedAtDestination) {
        setDbResult({
          success: true,
          warning: true,
          message: `An existing ReptiLogic database was found at that location. Your current data has been written there. The app will load from ${result.path} on next launch.`,
        })
      } else {
        setDbResult({
          success: true,
          message: `Database will be stored at:\n${result.path}`,
        })
      }
      setDbPath(result.path)
    } catch (e) {
      setDbResult({ success: false, message: e.message })
    } finally {
      setChoosing(false)
    }
  }

  const handleFinish = async () => {
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
              This quick guide will walk you through what the app can do and help you get set up in about a minute.
            </p>
            <div className="frm-actions">
              <button className="btn btn-primary btn-lg" onClick={next}>Get started →</button>
            </div>
          </div>
        )}

        {/* ── Step 1: Features overview ────────────────────────── */}
        {step === 1 && (
          <div className="frm-step">
            <h2 className="frm-title">What's inside</h2>
            <div className="frm-feature-grid">
              {[
                { icon: '🐍', title: 'Collection',        desc: 'Track every animal with photos, morphs, weights, and full history.' },
                { icon: '🏥', title: 'Health',            desc: 'Log health issues, medications, vet visits, and weight trends.' },
                { icon: '🥚', title: 'Breeding',          desc: 'Manage pairings, clutches, and individual offspring through the full lifecycle.' },
                { icon: '🧬', title: 'Genetics Calc',     desc: 'Calculate offspring odds for any gene combination across all inheritance types.' },
                { icon: '📖', title: 'Morph Library',     desc: '130+ ball python and 25+ hognose morphs built in. Add your own too.' },
                { icon: '⚙️', title: 'Export & Import',   desc: 'CSV exports for collection, breeding, and health. Full database backup and restore.' },
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
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
              <button className="btn btn-primary btn-lg" onClick={next}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Database location ────────────────────────── */}
        {step === 2 && (
          <div className="frm-step">
            <h2 className="frm-title">Where should your data live?</h2>
            <p className="frm-sub">
              By default your database is stored in your local app data folder. You can optionally move it to a cloud-synced folder like <strong>OneDrive</strong>, <strong>Google Drive</strong>, or <strong>Dropbox</strong> — this gives you an automatic live backup and lets you access your collection from multiple PCs.
            </p>

            <div className="frm-db-options">
              <div className="frm-db-option frm-db-option--default">
                <div className="frm-db-option-icon">🖥️</div>
                <div>
                  <div className="frm-db-option-title">Keep default location</div>
                  <div className="frm-db-option-desc">Stored locally in your AppData folder. Fast and private — no sync required.</div>
                </div>
              </div>

              <div className="frm-db-option frm-db-option--cloud">
                <div className="frm-db-option-icon">☁️</div>
                <div>
                  <div className="frm-db-option-title">Use a cloud folder</div>
                  <div className="frm-db-option-desc">
                    Choose your OneDrive, Google Drive, or Dropbox folder. ReptiLogic will create a <code>ReptiLogic/</code> subfolder inside it and store the database there.
                  </div>
                </div>
              </div>
            </div>

            {dbResult && (
              <div className={`frm-db-result ${dbResult.success ? (dbResult.warning ? 'warning' : 'success') : 'error'}`}>
                {dbResult.success ? (dbResult.warning ? '⚠ ' : '✓ ') : '✗ '}
                {dbResult.message}
              </div>
            )}

            <div className="frm-actions">
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
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

        {/* ── Step 3: Done ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="frm-step frm-step--center">
            <div className="frm-done-icon">🎉</div>
            <h2 className="frm-title">You're all set!</h2>
            <p className="frm-sub">
              Head to <strong>Collection</strong> to add your first animal, or check out the <strong>Morph Library</strong> to explore the gene database.
            </p>
            <p className="frm-sub" style={{ fontSize: 13 }}>
              You can change any of these settings later under <strong>Settings → Preferences</strong>.
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
