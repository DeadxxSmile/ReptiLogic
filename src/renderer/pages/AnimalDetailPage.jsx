import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAnimal, useAsync } from '../hooks/useData'
import {
  AnimalPhoto, MorphTagList, SexBadge, StatusBadge,
  LoadingSpinner, PageError, EmptyState, StatTile, ConfirmDialog
} from '../components/shared'
import { ageString, formatDate, formatDateShort, formatWeight, timeAgo, pluralise } from '../utils/format'
import './AnimalDetailPage.css'

const TABS = ['Overview', 'Lineage', 'Breeding history', 'Weight log', 'Feeding log', 'Photos']

export default function AnimalDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const { data: animal, loading, error, refetch } = useAnimal(id)
  const { data: history } = useAsync(() => window.api.animals.getHistory(id), [id])

  const [tab,        setTab]        = useState('Overview')
  const [confirm,    setConfirm]    = useState(false)
  const [printing,   setPrinting]   = useState(false)
  const [printError, setPrintError] = useState(null)

  const handleDelete = async () => {
    await window.api.animals.delete(id)
    navigate('/collection')
  }

  const handlePrint = async () => {
    setPrinting(true)
    setPrintError(null)
    try {
      const result = await window.api.print.husbandryReport(id)
      if (!result.success) { setPrintError(result.error); return }
      // Open in a new window for printing
      const win = window.open('', '_blank', 'width=900,height=700')
      win.document.write(result.html)
      win.document.close()
      setTimeout(() => win.print(), 600)
    } catch (e) {
      setPrintError(e.message)
    } finally {
      setPrinting(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading animal…" />
  if (error)   return <PageError message={error} />
  if (!animal) return <PageError message="Animal not found." />

  const latestWeight  = animal.measurements?.[0]
  const breedingCount = history?.breedingRecords?.length || 0

  return (
    <div className="animal-detail-page">

      {confirm && (
        <ConfirmDialog
          title={`Delete ${animal.name}?`}
          message="This will permanently delete this animal and all its records. This cannot be undone."
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirm(false)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="detail-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/collection')}>← Collection</button>

        <div className="detail-hero">
          <AnimalPhoto filename={animal.primary_photo_filename} name={animal.name} size={100}
            style={{ borderRadius: 'var(--radius-lg)' }} />

          <div className="detail-hero-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1>{animal.name}</h1>
              <SexBadge sex={animal.sex} />
              <StatusBadge status={animal.status} />
              {animal.dob_estimated && (
                <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>~estimated DOB</span>
              )}
            </div>

            {animal.animal_id && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-text)', marginTop: 2, letterSpacing: '0.05em' }}>
                ID: {animal.animal_id}
              </div>
            )}

            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
              {animal.species_name}
              {animal.scientific_name && <em style={{ color: 'var(--text-muted)' }}> · {animal.scientific_name}</em>}
            </div>

            {(animal.father_name || animal.mother_name) && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {animal.father_name && <span>♂ {animal.father_name}</span>}
                {animal.father_name && animal.mother_name && <span style={{ margin: '0 6px' }}>×</span>}
                {animal.mother_name && <span>♀ {animal.mother_name}</span>}
              </div>
            )}

            <MorphTagList morphs={animal.morphs || []} style={{ marginTop: 8 }} />

            {animal.morphs?.some(m => m.has_health_concern) && (
              <div className="health-warning">
                ⚠ {animal.morphs.filter(m => m.has_health_concern).map(m => m.health_concern_desc).filter(Boolean).join(' · ')}
              </div>
            )}
          </div>

          <div className="detail-hero-actions">
            <button className="btn btn-secondary btn-sm" onClick={handlePrint} disabled={printing} title="Print husbandry report">
              {printing ? '⏳' : '🖨️'} Print
            </button>
            <button className="btn btn-secondary" onClick={() => navigate(`/collection/${id}/edit`)}>Edit</button>
            <button className="btn btn-ghost" style={{ color: 'var(--text-muted)' }} onClick={() => setConfirm(true)}>Delete</button>
          </div>
        </div>
        {printError && (
          <div style={{ background: 'var(--red-dim)', color: 'var(--red-text)', padding: '8px 14px', borderRadius: 'var(--radius-md)', marginTop: 8, fontSize: 13 }}>
            Print failed: {printError}
          </div>
        )}
      </div>

      {/* ── Stat tiles ──────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatTile label="Age" value={ageString(animal.dob)} sub={animal.dob ? formatDate(animal.dob) : 'No DOB recorded'} />
        <StatTile label="Weight" value={formatWeight(latestWeight?.weight_grams || animal.weight_grams)}
          sub={latestWeight ? `Recorded ${timeAgo(latestWeight.measured_at)}` : 'No measurements'} />
        <StatTile label="Breeding records" value={breedingCount}
          sub={breedingCount > 0 ? 'View breeding history' : 'No breeding recorded'} />
        <StatTile label="Acquired" value={animal.acquired_date ? formatDate(animal.acquired_date, 'MMM yyyy') : '—'}
          sub={animal.acquired_from || 'Source unknown'} />
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === 'Overview'           && <OverviewTab animal={animal} />}
        {tab === 'Lineage'            && <LineageTab animalId={id} />}
        {tab === 'Breeding history'   && <BreedingHistoryTab history={history} animal={animal} />}
        {tab === 'Weight log'         && <WeightLogTab animal={animal} refetch={refetch} />}
        {tab === 'Feeding log'        && <FeedingLogTab animal={animal} refetch={refetch} />}
        {tab === 'Photos'             && <PhotosTab animal={animal} refetch={refetch} />}
      </div>
    </div>
  )
}

// ── Lineage tab ───────────────────────────────────────────────────────────────
function LineageTab({ animalId }) {
  const { data: lineage, loading } = useAsync(() => window.api.animals.getLineage(animalId), [animalId])

  if (loading) return <LoadingSpinner />
  if (!lineage) return <EmptyState icon="🌳" message="No lineage data found." />

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Family Tree</h3>
      <LineageNode node={lineage} depth={0} isSelf />
    </div>
  )
}

function LineageNode({ node, depth, isSelf }) {
  const navigate = useNavigate()
  if (!node) return null

  const sexColor = node.sex === 'male' ? 'var(--blue-text)' : node.sex === 'female' ? 'var(--purple-text)' : 'var(--text-muted)'
  const sexIcon  = node.sex === 'male' ? '♂' : node.sex === 'female' ? '♀' : '?'

  return (
    <div style={{ paddingLeft: depth * 28, marginBottom: 8 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: isSelf ? 'var(--accent-dim)' : 'var(--surface-2)',
        border: `1px solid ${isSelf ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)', padding: '8px 14px',
        cursor: node.id && !isSelf ? 'pointer' : 'default',
        transition: 'opacity .15s',
      }}
        onClick={() => !isSelf && node.id && navigate(`/collection/${node.id}`)}
      >
        <span style={{ color: sexColor, fontWeight: 700 }}>{sexIcon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{node.name || 'Unknown'}</div>
          {node.animal_id && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{node.animal_id}</div>}
          {node.morph_summary && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{node.morph_summary}</div>}
        </div>
        {isSelf && <span style={{ fontSize: 11, color: 'var(--accent-text)', marginLeft: 4 }}>← this animal</span>}
      </div>

      {(node.father || node.mother) && (
        <div style={{ marginTop: 4 }}>
          {node.father && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, marginRight: 4, paddingTop: 9 }}>├─</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, paddingLeft: 28 }}>Sire</div>
                <LineageNode node={node.father} depth={depth + 1} />
              </div>
            </div>
          )}
          {node.mother && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, marginRight: 4, paddingTop: 9 }}>└─</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, paddingLeft: 28 }}>Dam</div>
                <LineageNode node={node.mother} depth={depth + 1} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ animal }) {
  return (
    <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>

      {/* Genetics card */}
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Genetic makeup</h3>
        {animal.morphs?.length === 0
          ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No genes recorded. Edit to add morphs.</p>
          : animal.morphs?.map(m => (
            <div key={m.morph_id} className="gene-row">
              <div className="gene-row-left">
                <span className="gene-name">{m.morph_name}</span>
                {m.has_health_concern === 1 && (
                  <span title={m.health_concern_desc} style={{ color: 'var(--amber-text)', fontSize: 12 }}>⚠</span>
                )}
              </div>
              <div className="gene-row-right">
                <span className={`badge badge-${m.inheritance_type}`}>{m.inheritance_type.replace('_', '-')}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 80, textAlign: 'right' }}>
                  {m.expression === 'visual'       ? 'Visual'
                  : m.expression === 'het'         ? 'Het'
                  : m.expression === 'possible_het' ? `${m.het_percent || 50}% poss het`
                  : m.expression === 'proven_het'   ? 'Proven het'
                  : m.expression === 'super'        ? (m.super_form_name || 'Super')
                  : m.expression}
                </span>
              </div>
            </div>
          ))
        }
      </div>

      {/* Details card */}
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Details</h3>
        <table style={{ width: '100%', fontSize: 13 }}>
          <tbody>
            <DetailRow label="Species"         value={animal.species_name} />
            <DetailRow label="Date of birth"   value={animal.dob ? `${formatDate(animal.dob)}${animal.dob_estimated ? ' (est.)' : ''}` : '—'} />
            <DetailRow label="Sex"             value={animal.sex === 'male' ? '♂ Male' : animal.sex === 'female' ? '♀ Female' : 'Unknown'} />
            <DetailRow label="Weight"          value={formatWeight(animal.weight_grams)} />
            <DetailRow label="Acquired"        value={formatDate(animal.acquired_date)} />
            <DetailRow label="Source"          value={animal.acquired_from || '—'} />
            <DetailRow label="Purchase price"  value={animal.acquisition_price ? `$${Number(animal.acquisition_price).toFixed(2)}` : '—'} />
            <DetailRow label="Status"          value={animal.status} />
          </tbody>
        </table>
        {animal.notes && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {animal.notes}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <tr>
      <td style={{ color: 'var(--text-muted)', paddingBottom: 6, paddingRight: 16, whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ paddingBottom: 6 }}>{value || '—'}</td>
    </tr>
  )
}

// ── Breeding history tab ─────────────────────────────────────────────────────
function BreedingHistoryTab({ history, animal }) {
  const records = history?.breedingRecords || []

  if (records.length === 0) {
    return <EmptyState icon="🥚" title="No breeding history" message="Breeding records involving this animal will appear here." />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {records.map(r => {
        const isMale    = r.male_id   === animal.id
        const partnerName = isMale ? r.female_name : r.male_name
        const role       = isMale ? 'Sire' : 'Dam'

        return (
          <Link key={r.id} to={`/breeding/${r.id}`} style={{ textDecoration: 'none' }}>
            <div className="card breeding-history-card">
              <div className="breeding-history-header">
                <div>
                  <span style={{ fontWeight: 600 }}>{role} × {partnerName}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 10 }}>
                    {formatDate(r.first_pairing_date)}
                  </span>
                </div>
                <span className="badge" style={{
                  background: r.status === 'hatched' ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  color: r.status === 'hatched' ? 'var(--accent-text)' : 'var(--text-secondary)',
                }}>
                  {r.status}
                </span>
              </div>
              {(r.total_eggs > 0 || r.hatched_count > 0) && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', gap: 16 }}>
                  {r.total_eggs    > 0 && <span>🥚 {pluralise(r.total_eggs, 'egg')}</span>}
                  {r.slug_count    > 0 && <span style={{ color: 'var(--red-text)' }}>Slugs: {r.slug_count}</span>}
                  {r.hatched_count > 0 && <span style={{ color: 'var(--accent-text)' }}>Hatched: {r.hatched_count}</span>}
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Weight log tab ───────────────────────────────────────────────────────────
function WeightLogTab({ animal, refetch }) {
  const [form, setForm] = useState({
    weight_grams: '',
    length_cm: '',
    measured_at: new Date().toISOString().slice(0, 10),
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const handleAdd = async () => {
    if (!form.weight_grams && !form.length_cm) {
      setError('Enter at least a weight or length')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await window.api.measurements.add(animal.id, form)
      setForm(f => ({ ...f, weight_grams: '', length_cm: '', notes: '' }))
      refetch()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const measurements = animal.measurements || []

  return (
    <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Add measurement</h3>
        {error && <div style={{ color: 'var(--red-text)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Weight (grams)</label>
            <input type="number" className="form-input" value={form.weight_grams}
              onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value }))} placeholder="e.g. 1450" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Length (cm)</label>
            <input type="number" className="form-input" value={form.length_cm}
              onChange={e => setForm(f => ({ ...f, length_cm: e.target.value }))} placeholder="e.g. 120" min="0" step="0.1" />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.measured_at}
              onChange={e => setForm(f => ({ ...f, measured_at: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? 'Adding…' : 'Add measurement'}
          </button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <h3>Measurement history</h3>
        </div>
        {measurements.length === 0
          ? <EmptyState icon="📏" title="No measurements" message="Log weight and length over time to track growth." />
          : <table>
              <thead><tr><th>Date</th><th>Weight</th><th>Length</th><th>Notes</th></tr></thead>
              <tbody>
                {measurements.map(m => (
                  <tr key={m.id}>
                    <td>{formatDateShort(m.measured_at)}</td>
                    <td>{formatWeight(m.weight_grams)}</td>
                    <td>{m.length_cm ? `${m.length_cm} cm` : '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  )
}

// ── Feeding log tab ──────────────────────────────────────────────────────────
function FeedingLogTab({ animal, refetch }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]   = useState({
    fed_at:            new Date().toISOString().slice(0, 10),
    prey_type:         '',
    prey_size:         '',
    prey_weight_grams: '',
    live:              false,
    refused:           false,
    notes:             '',
  })
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    setSaving(true)
    try {
      await window.api.feedings.add(animal.id, form)
      setShowForm(false)
      setForm(f => ({ ...f, prey_type: '', prey_size: '', prey_weight_grams: '', live: false, refused: false, notes: '' }))
      refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const feedings = animal.feedings || []
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? '× Cancel' : '+ Log feeding'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 14 }}>Log feeding</h3>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.fed_at} onChange={e => set('fed_at', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Prey type</label>
              <select className="form-select" value={form.prey_type} onChange={e => set('prey_type', e.target.value)}>
                <option value="">Select…</option>
                {['Frozen mouse','Frozen rat','Frozen chick','Live mouse','Live rat','African soft fur','Quail','Rabbit','Other'].map(p =>
                  <option key={p} value={p}>{p}</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Prey size</label>
              <select className="form-select" value={form.prey_size} onChange={e => set('prey_size', e.target.value)}>
                <option value="">Select…</option>
                {['Pinky','Fuzzy','Hopper','Small','Medium','Large','XL','Jumbo'].map(s =>
                  <option key={s} value={s}>{s}</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Prey weight (g)</label>
              <input type="number" className="form-input" value={form.prey_weight_grams}
                onChange={e => set('prey_weight_grams', e.target.value)} placeholder="Optional" min="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, margin: '10px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.live} onChange={e => set('live', e.target.checked)} />
              Live prey
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: form.refused ? 'var(--red-text)' : 'inherit' }}>
              <input type="checkbox" checked={form.refused} onChange={e => set('refused', e.target.checked)} />
              Refused feed
            </label>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving…' : 'Log feeding'}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {feedings.length === 0
          ? <EmptyState icon="🐭" title="No feedings logged" message="Track feeding history to monitor appetite and growth." />
          : <table>
              <thead>
                <tr><th>Date</th><th>Prey</th><th>Size</th><th>Weight</th><th>Live?</th><th>Result</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {feedings.map(f => (
                  <tr key={f.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateShort(f.fed_at)}</td>
                    <td>{f.prey_type || '—'}</td>
                    <td>{f.prey_size || '—'}</td>
                    <td>{f.prey_weight_grams ? `${f.prey_weight_grams}g` : '—'}</td>
                    <td>{f.live ? <span style={{ color: 'var(--amber-text)' }}>Live</span> : '—'}</td>
                    <td>
                      {f.refused
                        ? <span style={{ color: 'var(--red-text)' }}>✗ Refused</span>
                        : <span style={{ color: 'var(--accent-text)' }}>✓ Ate</span>
                      }
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{f.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  )
}

// ── Photos tab ───────────────────────────────────────────────────────────────
function PhotosTab({ animal, refetch }) {
  const [adding,   setAdding]   = useState(false)
  const [deleting, setDeleting] = useState(null)

  const handleAdd = async () => {
    setAdding(true)
    try {
      const chosen = await window.api.photos.choose()
      if (chosen?.length) {
        await window.api.photos.save(animal.id, chosen)
        refetch()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (photoId) => {
    setDeleting(photoId)
    try {
      await window.api.photos.delete(photoId)
      refetch()
    } finally {
      setDeleting(null)
    }
  }

  const handleSetPrimary = async (photoId) => {
    await window.api.photos.setPrimary(animal.id, photoId)
    refetch()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>
          {adding ? 'Choosing…' : '+ Add Photos'}
        </button>
      </div>

      {!animal.photos?.length
        ? <EmptyState icon="📷" title="No photos" message="Add photos to document this animal's appearance over time." />
        : <div className="photo-gallery">
            {animal.photos.map(p => (
              <PhotoThumb
                key={p.id}
                photo={p}
                animalName={animal.name}
                isPrimary={p.id === animal.primary_photo_id || p.is_primary === 1}
                isDeleting={deleting === p.id}
                onDelete={() => handleDelete(p.id)}
                onSetPrimary={() => handleSetPrimary(p.id)}
              />
            ))}
          </div>
      }
    </div>
  )
}

function PhotoThumb({ photo, animalName, isPrimary, isDeleting, onDelete, onSetPrimary }) {
  const [src, setSrc] = useState(null)

  React.useEffect(() => {
    window.api.photos.getPath(photo.filename).then(p => setSrc(`file://${p}`)).catch(() => {})
  }, [photo.filename])

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: `2px solid ${isPrimary ? 'var(--accent)' : 'var(--border)'}` }}>
      {src
        ? <img src={src} alt={animalName} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: 160, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      }
      <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
        {!isPrimary && (
          <button
            onClick={onSetPrimary}
            title="Set as primary photo"
            style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, padding: '3px 6px', cursor: 'pointer' }}
          >
            ★ Primary
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          title="Delete photo"
          style={{ background: 'rgba(180,40,40,0.8)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 13, padding: '3px 7px', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
      {isPrimary && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(74,124,89,0.85)', color: '#fff', fontSize: 11, textAlign: 'center', padding: '3px 0' }}>
          Primary
        </div>
      )}
    </div>
  )
}
