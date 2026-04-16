import React, { useState, useMemo } from 'react'
import { useAsync } from '../hooks/useData'
import { AnimalPhoto, LoadingSpinner, EmptyState, StatTile } from '../components/shared'
import { formatDate, formatDateShort, timeAgo, formatWeight } from '../utils/format'
import './HealthPage.css'

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HealthPage() {
  const { data: animals, loading, refetch } = useAsync(() => window.api.health.getAllAnimalsOverview(), [])
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!animals) return []
    if (!search) return animals
    const q = search.toLowerCase()
    return animals.filter(a => a.name?.toLowerCase().includes(q) || a.species_name?.toLowerCase().includes(q))
  }, [animals, search])

  const selected = animals?.find(a => a.id === selectedId)

  return (
    <div className="health-page">
      <div className="page-header">
        <h1>Health</h1>
        {selectedId && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedId(null)}>
            ← All animals
          </button>
        )}
      </div>

      {selectedId && selected ? (
        <AnimalHealthDetail
          animal={selected}
          onBack={() => setSelectedId(null)}
          onUpdate={refetch}
        />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <input
              className="form-input"
              style={{ maxWidth: 280 }}
              placeholder="Search animals…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? <LoadingSpinner label="Loading health overview…" /> : (
            filtered.length === 0
              ? <EmptyState icon="🏥" title="No active animals" message="Animals will appear here once added to your collection." />
              : <div className="health-animal-grid">
                  {filtered.map(a => (
                    <HealthAnimalCard key={a.id} animal={a} onClick={() => setSelectedId(a.id)} />
                  ))}
                </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Animal card in the list ───────────────────────────────────────────────────
function HealthAnimalCard({ animal: a, onClick }) {
  const hasAlert = a.active_issues > 0 || a.active_meds > 0

  return (
    <div className={`health-animal-card ${hasAlert ? 'health-animal-card--alert' : ''}`} onClick={onClick}>
      <div className="health-animal-card__photo">
        <AnimalPhoto filename={a.primary_photo_filename} name={a.name} size={52} />
        {a.active_issues > 0 && (
          <span className="health-issue-dot" title={`${a.active_issues} active issue${a.active_issues !== 1 ? 's' : ''}`} />
        )}
      </div>

      <div className="health-animal-card__info">
        <div className="health-animal-card__name">{a.name}</div>
        <div className="health-animal-card__species">{a.species_name}</div>

        <div className="health-animal-card__stats">
          {a.latest_weight && (
            <span className="health-stat">⚖️ {formatWeight(a.latest_weight)}</span>
          )}
          {a.last_fed ? (
            <span className="health-stat" style={{ color: isOverdue(a.last_fed, 14) ? 'var(--amber-text)' : 'var(--text-muted)' }}>
              🐭 {timeAgo(a.last_fed)}
            </span>
          ) : (
            <span className="health-stat" style={{ color: 'var(--text-muted)' }}>🐭 No feedings</span>
          )}
        </div>

        <div className="health-animal-card__badges">
          {a.active_issues > 0 && (
            <span className="badge badge-health">⚠ {a.active_issues} issue{a.active_issues !== 1 ? 's' : ''}</span>
          )}
          {a.active_meds > 0 && (
            <span className="badge" style={{ background: 'var(--blue-dim)', color: 'var(--blue-text)' }}>
              💊 {a.active_meds} med{a.active_meds !== 1 ? 's' : ''}
            </span>
          )}
          {a.active_issues === 0 && a.active_meds === 0 && (
            <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)' }}>✓ Healthy</span>
          )}
        </div>
      </div>
    </div>
  )
}

function isOverdue(dateStr, days) {
  if (!dateStr) return true
  const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  return diff >= days
}

// ── Per-animal health detail ──────────────────────────────────────────────────
const TABS = ['Overview', 'Weight & Feeding', 'Health Issues', 'Medications', 'Vet Visits']

function AnimalHealthDetail({ animal, onBack, onUpdate }) {
  const [tab, setTab] = useState('Overview')
  const { data: summary, loading, refetch } = useAsync(
    () => window.api.health.getSummaryForAnimal(animal.id),
    [animal.id]
  )

  const refresh = () => { refetch(); onUpdate() }

  if (loading) return <LoadingSpinner />

  const { issues = [], medications = [], vetVisits = [], measurements = [], feedings = [] } = summary || {}

  return (
    <div className="health-detail">
      {/* ── Animal header ──────────────────────────────────── */}
      <div className="health-detail__header">
        <AnimalPhoto filename={animal.primary_photo_filename} name={animal.name} size={64} />
        <div>
          <h2 style={{ marginBottom: 2 }}>{animal.name}</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{animal.species_name}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {issues.filter(i => i.status !== 'resolved').map(i => (
              <span key={i.id} className={`badge badge-${severityClass(i.severity)}`}>
                {i.title}
              </span>
            ))}
            {medications.filter(m => m.active).map(m => (
              <span key={m.id} className="badge" style={{ background: 'var(--blue-dim)', color: 'var(--blue-text)' }}>
                💊 {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
            {t === 'Health Issues' && issues.filter(i => i.status !== 'resolved').length > 0 && (
              <span className="tab-badge">{issues.filter(i => i.status !== 'resolved').length}</span>
            )}
            {t === 'Medications' && medications.filter(m => m.active).length > 0 && (
              <span className="tab-badge tab-badge--blue">{medications.filter(m => m.active).length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="health-detail__content">
        {tab === 'Overview'         && <OverviewTab animal={animal} issues={issues} medications={medications} vetVisits={vetVisits} measurements={measurements} feedings={feedings} />}
        {tab === 'Weight & Feeding' && <WeightFeedingTab animal={animal} measurements={measurements} feedings={feedings} refetch={refresh} />}
        {tab === 'Health Issues'    && <HealthIssuesTab animalId={animal.id} issues={issues} refetch={refresh} />}
        {tab === 'Medications'      && <MedicationsTab animalId={animal.id} medications={medications} refetch={refresh} />}
        {tab === 'Vet Visits'       && <VetVisitsTab animalId={animal.id} vetVisits={vetVisits} refetch={refresh} />}
      </div>
    </div>
  )
}

function severityClass(severity) {
  return { critical: 'health', serious: 'health', moderate: 'amber', minor: 'blue' }[severity] || 'blue'
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ animal, issues, medications, vetVisits, measurements, feedings }) {
  const activeIssues = issues.filter(i => i.status !== 'resolved')
  const activeMeds   = medications.filter(m => m.active)
  const lastMeasure  = measurements[0]
  const lastFeeding  = feedings[0]

  // Simple weight trend
  const recentWeights = measurements.filter(m => m.weight_grams).slice(0, 10).reverse()

  return (
    <div>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatTile label="Active issues"  value={activeIssues.length} color={activeIssues.length > 0 ? 'var(--red-text)' : 'var(--accent-text)'} />
        <StatTile label="Medications"    value={activeMeds.length}   color={activeMeds.length > 0 ? 'var(--blue-text)' : 'var(--text-secondary)'} />
        <StatTile label="Current weight" value={formatWeight(lastMeasure?.weight_grams || animal.latest_weight)} sub={lastMeasure ? timeAgo(lastMeasure.measured_at) : 'Not recorded'} />
        <StatTile label="Last fed"       value={lastFeeding ? timeAgo(lastFeeding.fed_at) : '—'} sub={lastFeeding ? `${lastFeeding.prey_type || ''} ${lastFeeding.prey_size || ''}`.trim() || 'No details' : 'No feedings logged'} />
      </div>

      {/* Weight chart */}
      {recentWeights.length > 1 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Weight trend</h3>
          <WeightChart measurements={recentWeights} />
        </div>
      )}

      {/* Active issues */}
      {activeIssues.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Active health issues</h3>
          {activeIssues.map(i => (
            <IssueRow key={i.id} issue={i} compact />
          ))}
        </div>
      )}

      {/* Active meds */}
      {activeMeds.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Current medications</h3>
          {activeMeds.map(m => (
            <div key={m.id} className="health-row">
              <span style={{ fontWeight: 600 }}>💊 {m.name}</span>
              {m.dosage    && <span style={{ color: 'var(--text-secondary)' }}>{m.dosage}</span>}
              {m.frequency && <span style={{ color: 'var(--text-muted)' }}>{m.frequency}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Last vet visit */}
      {vetVisits[0] && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Last vet visit</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 14 }}>
            <InfoRow label="Date"   value={formatDate(vetVisits[0].visit_date)} />
            <InfoRow label="Reason" value={vetVisits[0].reason} />
            {vetVisits[0].vet_name    && <InfoRow label="Vet"      value={vetVisits[0].vet_name} />}
            {vetVisits[0].diagnosis   && <InfoRow label="Diagnosis" value={vetVisits[0].diagnosis} />}
            {vetVisits[0].follow_up_date && <InfoRow label="Follow-up" value={formatDate(vetVisits[0].follow_up_date)} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Weight chart (pure SVG, no dependencies) ──────────────────────────────────
function WeightChart({ measurements }) {
  const W = 600, H = 140, PAD = { top: 12, right: 20, bottom: 32, left: 52 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom

  const weights = measurements.map(m => m.weight_grams)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 1

  const pts = measurements.map((m, i) => ({
    x: PAD.left + (i / (measurements.length - 1)) * innerW,
    y: PAD.top  + innerH - ((m.weight_grams - minW) / range) * innerH,
    label: m.measured_at,
    weight: m.weight_grams,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Tick labels
  const dateLabels = measurements.filter((_, i) => i === 0 || i === measurements.length - 1 || (measurements.length > 4 && i % Math.floor(measurements.length / 4) === 0))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      {/* Y-axis labels */}
      {[0, 0.5, 1].map(t => {
        const y  = PAD.top + innerH - t * innerH
        const wt = minW + t * range
        return (
          <g key={t}>
            <line x1={PAD.left - 4} y1={y} x2={PAD.left + innerW} y2={y}
              stroke="var(--border)" strokeWidth="0.5" strokeDasharray={t === 0 || t === 1 ? 'none' : '3 3'} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
              {formatWeight(wt)}
            </text>
          </g>
        )
      })}

      {/* Line */}
      <path d={pathD} fill="none" stroke="var(--accent-bright)" strokeWidth="2" strokeLinejoin="round" />

      {/* Area fill */}
      <path
        d={`${pathD} L${pts[pts.length-1].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`}
        fill="var(--accent)"
        opacity="0.12"
      />

      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--accent-bright)" stroke="var(--bg-surface)" strokeWidth="1.5">
          <title>{formatWeight(p.weight)} — {formatDateShort(p.label)}</title>
        </circle>
      ))}

      {/* X-axis date labels */}
      {pts.filter((_, i) => i === 0 || i === pts.length - 1).map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
          {formatDateShort(measurements[i === 0 ? 0 : measurements.length - 1].measured_at)}
        </text>
      ))}
    </svg>
  )
}

// ── Weight & Feeding tab ──────────────────────────────────────────────────────
function WeightFeedingTab({ animal, measurements, feedings, refetch }) {
  const [showWeightForm,   setShowWeightForm]   = useState(false)
  const [showFeedingForm,  setShowFeedingForm]  = useState(false)

  const recentWeights = measurements.filter(m => m.weight_grams).slice(0, 20).reverse()

  return (
    <div>
      <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>

        {/* Weight section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Weight log</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowWeightForm(v => !v)}>
              {showWeightForm ? '× Cancel' : '+ Log weight'}
            </button>
          </div>

          {showWeightForm && (
            <WeightForm animalId={animal.id} onSaved={() => { setShowWeightForm(false); refetch() }} />
          )}

          {recentWeights.length > 1 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <WeightChart measurements={recentWeights} />
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {measurements.length === 0
              ? <EmptyState icon="⚖️" title="No measurements" message="Log weight and length to track growth over time." />
              : <table>
                  <thead><tr><th>Date</th><th>Weight</th><th>Length</th><th>Notes</th></tr></thead>
                  <tbody>
                    {measurements.map(m => (
                      <tr key={m.id}>
                        <td>{formatDateShort(m.measured_at)}</td>
                        <td>{m.weight_grams ? formatWeight(m.weight_grams) : '—'}</td>
                        <td>{m.length_cm ? `${m.length_cm} cm` : '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{m.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </div>

        {/* Feeding section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Feeding log</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowFeedingForm(v => !v)}>
              {showFeedingForm ? '× Cancel' : '+ Log feeding'}
            </button>
          </div>

          {showFeedingForm && (
            <FeedingForm animalId={animal.id} onSaved={() => { setShowFeedingForm(false); refetch() }} />
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {feedings.length === 0
              ? <EmptyState icon="🐭" title="No feedings logged" message="Track feedings to monitor appetite and health patterns." />
              : <table>
                  <thead><tr><th>Date</th><th>Prey</th><th>Size</th><th>Result</th></tr></thead>
                  <tbody>
                    {feedings.map(f => (
                      <tr key={f.id}>
                        <td>{formatDateShort(f.fed_at)}</td>
                        <td>{f.prey_type || '—'}</td>
                        <td>{f.prey_size || '—'}</td>
                        <td>
                          {f.refused
                            ? <span style={{ color: 'var(--red-text)' }}>✗ Refused</span>
                            : <span style={{ color: 'var(--accent-text)' }}>✓ Ate</span>
                          }
                          {f.live ? <span style={{ color: 'var(--amber-text)', marginLeft: 6 }}>Live</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Weight form ───────────────────────────────────────────────────────────────
function WeightForm({ animalId, onSaved }) {
  const [form, setForm] = useState({ weight_grams: '', length_cm: '', measured_at: today(), notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.weight_grams && !form.length_cm) return
    setSaving(true)
    try { await window.api.measurements.add(animalId, form); onSaved() }
    catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ minWidth: 120 }}>
          <label className="form-label">Weight (g)</label>
          <input type="number" className="form-input" value={form.weight_grams} onChange={e => set('weight_grams', e.target.value)} placeholder="e.g. 1450" min="0" />
        </div>
        <div className="form-group" style={{ minWidth: 110 }}>
          <label className="form-label">Length (cm)</label>
          <input type="number" className="form-input" value={form.length_cm} onChange={e => set('length_cm', e.target.value)} placeholder="e.g. 120" min="0" step="0.1" />
        </div>
        <div className="form-group" style={{ minWidth: 140 }}>
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.measured_at} onChange={e => set('measured_at', e.target.value)} />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
          <label className="form-label">Notes</label>
          <input className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginBottom: 0 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Feeding form ──────────────────────────────────────────────────────────────
function FeedingForm({ animalId, onSaved }) {
  const [form, setForm] = useState({ fed_at: today(), prey_type: '', prey_size: '', live: false, refused: false, notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try { await window.api.feedings.add(animalId, form); onSaved() }
    catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ minWidth: 140 }}>
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.fed_at} onChange={e => set('fed_at', e.target.value)} />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">Prey type</label>
          <select className="form-select" value={form.prey_type} onChange={e => set('prey_type', e.target.value)}>
            <option value="">Select…</option>
            {['Frozen mouse','Frozen rat','Frozen chick','Live mouse','Live rat','African soft fur','Quail','Rabbit','Other'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 120 }}>
          <label className="form-label">Size</label>
          <select className="form-select" value={form.prey_size} onChange={e => set('prey_size', e.target.value)}>
            <option value="">Select…</option>
            {['Pinky','Fuzzy','Hopper','Small','Medium','Large','XL','Jumbo'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 16, alignSelf: 'flex-end', paddingBottom: 1 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.live} onChange={e => set('live', e.target.checked)} /> Live
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: form.refused ? 'var(--red-text)' : 'inherit' }}>
            <input type="checkbox" checked={form.refused} onChange={e => set('refused', e.target.checked)} /> Refused
          </label>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Log feeding'}
        </button>
      </div>
    </div>
  )
}

// ── Health Issues tab ─────────────────────────────────────────────────────────
function HealthIssuesTab({ animalId, issues, refetch }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {issues.filter(i => i.status !== 'resolved').length} active
            {issues.filter(i => i.status === 'resolved').length > 0 && `, ${issues.filter(i => i.status === 'resolved').length} resolved`}
          </span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? '× Cancel' : '+ Log issue'}
        </button>
      </div>

      {showForm && (
        <HealthIssueForm animalId={animalId} onSaved={() => { setShowForm(false); refetch() }} />
      )}

      {issues.length === 0 && !showForm
        ? <EmptyState icon="✅" title="No health issues recorded" message="Log injuries, infections, or any health concerns here." />
        : issues.map(i => (
            <IssueRow key={i.id} issue={i} animalId={animalId} onUpdate={refetch} />
          ))
      }
    </div>
  )
}

function IssueRow({ issue: i, animalId, onUpdate, compact }) {
  const [editing, setEditing] = useState(false)

  const handleResolve = async () => {
    await window.api.health.updateIssue(i.id, { status: 'resolved', resolved_date: today() })
    onUpdate?.()
  }

  const handleDelete = async () => {
    await window.api.health.deleteIssue(i.id)
    onUpdate?.()
  }

  const severityColor = { critical: 'var(--red-text)', serious: 'var(--red-text)', moderate: 'var(--amber-text)', minor: 'var(--blue-text)' }

  return (
    <div className={`health-issue-row ${i.status === 'resolved' ? 'health-issue-row--resolved' : ''}`}>
      <div className="health-issue-row__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{i.title}</span>
          <span className="badge" style={{ background: 'var(--bg-elevated)', color: severityColor[i.severity], border: '1px solid var(--border)', fontSize: 11 }}>
            {i.severity}
          </span>
          <span className="badge" style={{
            background: i.status === 'resolved' ? 'var(--accent-dim)' : i.status === 'monitoring' ? 'var(--amber-dim)' : 'var(--red-dim)',
            color: i.status === 'resolved' ? 'var(--accent-text)' : i.status === 'monitoring' ? 'var(--amber-text)' : 'var(--red-text)',
            fontSize: 11,
          }}>
            {i.status}
          </span>
        </div>
        {!compact && onUpdate && (
          <div style={{ display: 'flex', gap: 6 }}>
            {i.status !== 'resolved' && (
              <button className="btn btn-ghost btn-sm" onClick={handleResolve} style={{ fontSize: 12, color: 'var(--accent-text)' }}>✓ Resolve</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={handleDelete} style={{ fontSize: 12, color: 'var(--text-muted)' }}>×</button>
          </div>
        )}
      </div>

      {i.onset_date && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Onset: {formatDate(i.onset_date)}
          {i.resolved_date && ` → Resolved: ${formatDate(i.resolved_date)}`}
        </div>
      )}
      {i.description && <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>{i.description}</div>}
      {i.treatment    && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Treatment: {i.treatment}</div>}
    </div>
  )
}

function HealthIssueForm({ animalId, onSaved, initial }) {
  const [form, setForm] = useState({
    title: initial?.title || '', category: initial?.category || 'general',
    severity: initial?.severity || 'minor', status: initial?.status || 'active',
    onset_date: initial?.onset_date?.slice(0,10) || today(),
    description: initial?.description || '', treatment: initial?.treatment || '', notes: initial?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await window.api.health.addIssue(animalId, form)
      onSaved()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="grid-2" style={{ gap: 12, marginBottom: 10 }}>
        <div className="form-group">
          <label className="form-label">Issue / condition *</label>
          <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Respiratory infection, Scale rot…" />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
            {['general','injury','infection','parasite','respiratory','neurological','digestive','shed','other'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Severity</label>
          <select className="form-select" value={form.severity} onChange={e => set('severity', e.target.value)}>
            <option value="minor">Minor</option>
            <option value="moderate">Moderate</option>
            <option value="serious">Serious</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Onset date</label>
          <input type="date" className="form-input" value={form.onset_date} onChange={e => set('onset_date', e.target.value)} />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 10 }}>
        <label className="form-label">Description</label>
        <textarea className="form-textarea" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe symptoms, appearance, behaviour…" />
      </div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">Treatment / action taken</label>
        <input className="form-input" value={form.treatment} onChange={e => set('treatment', e.target.value)} placeholder="e.g. Baytril 0.5ml daily, isolation, warm soak…" />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
          {saving ? 'Saving…' : 'Log issue'}
        </button>
      </div>
    </div>
  )
}

// ── Medications tab ───────────────────────────────────────────────────────────
function MedicationsTab({ animalId, medications, refetch }) {
  const [showForm, setShowForm] = useState(false)

  const active   = medications.filter(m => m.active)
  const inactive = medications.filter(m => !m.active)

  const handleToggle = async (med) => {
    await window.api.health.updateMedication(med.id, { active: med.active ? 0 : 1 })
    refetch()
  }

  const handleDelete = async (id) => {
    await window.api.health.deleteMedication(id)
    refetch()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? '× Cancel' : '+ Add medication'}
        </button>
      </div>

      {showForm && <MedicationForm animalId={animalId} onSaved={() => { setShowForm(false); refetch() }} />}

      {medications.length === 0 && !showForm
        ? <EmptyState icon="💊" title="No medications recorded" message="Track current and past medications here." />
        : null
      }

      {active.length > 0 && (
        <>
          <div className="section-title">Current medications</div>
          {active.map(m => <MedRow key={m.id} med={m} onToggle={() => handleToggle(m)} onDelete={() => handleDelete(m.id)} />)}
        </>
      )}

      {inactive.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 20 }}>Past medications</div>
          {inactive.map(m => <MedRow key={m.id} med={m} onToggle={() => handleToggle(m)} onDelete={() => handleDelete(m.id)} />)}
        </>
      )}
    </div>
  )
}

function MedRow({ med: m, onToggle, onDelete }) {
  return (
    <div className="health-issue-row" style={{ opacity: m.active ? 1 : 0.6 }}>
      <div className="health-issue-row__header">
        <div>
          <span style={{ fontWeight: 600 }}>💊 {m.name}</span>
          {m.dosage    && <span style={{ color: 'var(--text-secondary)', marginLeft: 10 }}>{m.dosage}</span>}
          {m.frequency && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{m.frequency}</span>}
          {m.route     && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({m.route})</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onToggle} style={{ fontSize: 12, color: m.active ? 'var(--text-muted)' : 'var(--accent-text)' }}>
            {m.active ? 'Mark ended' : 'Reactivate'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onDelete} style={{ fontSize: 12, color: 'var(--text-muted)' }}>×</button>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
        {m.start_date && `Started: ${formatDate(m.start_date)}`}
        {m.end_date   && ` · Ended: ${formatDate(m.end_date)}`}
        {m.prescribed_by && ` · Prescribed by: ${m.prescribed_by}`}
        {m.reason && ` · Reason: ${m.reason}`}
      </div>
    </div>
  )
}

function MedicationForm({ animalId, onSaved }) {
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '', route: 'oral', start_date: today(), end_date: '', prescribed_by: '', reason: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try { await window.api.health.addMedication(animalId, form); onSaved() }
    catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="grid-2" style={{ gap: 12, marginBottom: 10 }}>
        <div className="form-group">
          <label className="form-label">Medication name *</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Baytril, Panacur, Ivermectin…" />
        </div>
        <div className="form-group">
          <label className="form-label">Dosage</label>
          <input className="form-input" value={form.dosage} onChange={e => set('dosage', e.target.value)} placeholder="e.g. 0.5ml, 10mg/kg" />
        </div>
        <div className="form-group">
          <label className="form-label">Frequency</label>
          <input className="form-input" value={form.frequency} onChange={e => set('frequency', e.target.value)} placeholder="e.g. Once daily, Every 48 hrs" />
        </div>
        <div className="form-group">
          <label className="form-label">Route</label>
          <select className="form-select" value={form.route} onChange={e => set('route', e.target.value)}>
            {['oral','topical','injection','nebulisation','other'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Start date</label>
          <input type="date" className="form-input" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">End date</label>
          <input type="date" className="form-input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Prescribed by</label>
          <input className="form-input" value={form.prescribed_by} onChange={e => set('prescribed_by', e.target.value)} placeholder="Vet name" />
        </div>
        <div className="form-group">
          <label className="form-label">Reason</label>
          <input className="form-input" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="e.g. Respiratory infection" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving ? 'Saving…' : 'Add medication'}
        </button>
      </div>
    </div>
  )
}

// ── Vet Visits tab ────────────────────────────────────────────────────────────
function VetVisitsTab({ animalId, vetVisits, refetch }) {
  const [showForm, setShowForm] = useState(false)

  const handleDelete = async (id) => {
    await window.api.health.deleteVetVisit(id)
    refetch()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? '× Cancel' : '+ Log vet visit'}
        </button>
      </div>

      {showForm && <VetVisitForm animalId={animalId} onSaved={() => { setShowForm(false); refetch() }} />}

      {vetVisits.length === 0 && !showForm
        ? <EmptyState icon="🏥" title="No vet visits recorded" message="Log vet visits to keep a medical history." />
        : vetVisits.map(v => (
            <div key={v.id} className="health-issue-row">
              <div className="health-issue-row__header">
                <div>
                  <span style={{ fontWeight: 600 }}>{formatDate(v.visit_date)}</span>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: 12 }}>{v.reason}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(v.id)} style={{ fontSize: 12, color: 'var(--text-muted)' }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginTop: 8, fontSize: 13 }}>
                {v.vet_name    && <InfoRow label="Vet"        value={v.vet_name} />}
                {v.clinic_name && <InfoRow label="Clinic"     value={v.clinic_name} />}
                {v.diagnosis   && <InfoRow label="Diagnosis"  value={v.diagnosis} />}
                {v.treatment   && <InfoRow label="Treatment"  value={v.treatment} />}
                {v.follow_up_date && <InfoRow label="Follow-up" value={formatDate(v.follow_up_date)} />}
                {v.cost        && <InfoRow label="Cost"       value={`$${v.cost}`} />}
              </div>
              {v.notes && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{v.notes}</div>}
            </div>
          ))
      }
    </div>
  )
}

function VetVisitForm({ animalId, onSaved }) {
  const [form, setForm] = useState({ visit_date: today(), vet_name: '', clinic_name: '', reason: '', diagnosis: '', treatment: '', follow_up_date: '', cost: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.reason.trim()) return
    setSaving(true)
    try { await window.api.health.addVetVisit(animalId, form); onSaved() }
    catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="grid-2" style={{ gap: 12, marginBottom: 10 }}>
        <div className="form-group">
          <label className="form-label">Visit date *</label>
          <input type="date" className="form-input" value={form.visit_date} onChange={e => set('visit_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Reason *</label>
          <input className="form-input" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Reason for visit" />
        </div>
        <div className="form-group">
          <label className="form-label">Vet name</label>
          <input className="form-input" value={form.vet_name} onChange={e => set('vet_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Clinic</label>
          <input className="form-input" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Diagnosis</label>
          <input className="form-input" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Treatment prescribed</label>
          <input className="form-input" value={form.treatment} onChange={e => set('treatment', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Follow-up date</label>
          <input type="date" className="form-input" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Cost ($)</label>
          <input type="number" className="form-input" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0.00" min="0" step="0.01" />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.reason.trim()}>
          {saving ? 'Saving…' : 'Log vet visit'}
        </button>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
