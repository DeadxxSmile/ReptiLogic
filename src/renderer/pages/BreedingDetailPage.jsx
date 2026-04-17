import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useBreedingRecord, useAsync } from '../hooks/useData'
import {
  AnimalPhoto, BreedingStatusBadge, LoadingSpinner, PageError, EmptyState, StatTile
} from '../components/shared'
import OffspringPanel from '../components/OffspringPanel'
import { formatDate, formatDateShort, pluralise } from '../utils/format'
import './BreedingDetailPage.css'

const STATUS_FLOW = ['planned', 'active', 'gravid', 'laid', 'hatched']

// Return a display label for a status value, aware of live-birth species
function statusFlowLabel(s, isLiveBirth) {
  if (s === 'laid')    return isLiveBirth ? 'Laid / Born'     : 'Laid'
  if (s === 'hatched') return isLiveBirth ? 'Hatched / Born'  : 'Hatched'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function BreedingDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { data: record, loading, error, refetch } = useBreedingRecord(id)

  const [showClutchForm,   setShowClutchForm]   = useState(false)
  const [showDateForm,     setShowDateForm]     = useState(false)
  const [showCalcResult,   setShowCalcResult]   = useState(null)
  const [showPairingForm,  setShowPairingForm]  = useState(false)

  if (loading) return <LoadingSpinner />
  if (error)   return <PageError message={error} />
  if (!record) return <PageError message="Record not found." />

  const runCalc = async () => {
    const result = await window.api.breeding.calculateOutcomes(record.male_id, record.female_id)
    setShowCalcResult(result)
  }

  const updateStatus = async (status) => {
    await window.api.breeding.update(id, { status })
    refetch()
  }

  const handleDateUpdate = async (dates) => {
    await window.api.breeding.update(id, dates)
    setShowDateForm(false)
    refetch()
  }

  return (
    <div className="breeding-detail-page">

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/breeding')}>← Breeding</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to={`/collection/${record.male_id}`}>
              <AnimalPhoto filename={record.male_photo} name={record.male_name} size={56} />
            </Link>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18 }}>
                <span style={{ color: 'var(--blue-text)' }}>♂</span> {record.male_name}
                <span style={{ color: 'var(--text-muted)', margin: '0 10px' }}>×</span>
                <span style={{ color: 'var(--purple-text)' }}>♀</span> {record.female_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {record.male_name} {record.species_id?.replace('_', ' ')}
              </div>
            </div>
            <Link to={`/collection/${record.female_id}`}>
              <AnimalPhoto filename={record.female_photo} name={record.female_name} size={56} />
            </Link>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={runCalc}>🧬 Genetics calc</button>
            <button className="btn btn-secondary" onClick={() => setShowDateForm(true)}>Edit dates</button>
          </div>
        </div>
      </div>

      {/* ── Status pipeline ──────────────────────────────────── */}
      <div className="status-pipeline card">
        {STATUS_FLOW.map((s, i) => {
          const statusIndex   = STATUS_FLOW.indexOf(record.status)
          const isActive      = record.status === s
          const isComplete    = STATUS_FLOW.indexOf(s) < statusIndex
          const isNext        = STATUS_FLOW.indexOf(s) === statusIndex + 1

          return (
            <React.Fragment key={s}>
              <button
                className={`pipeline-step ${isActive ? 'pipeline-active' : ''} ${isComplete ? 'pipeline-complete' : ''}`}
                onClick={() => isNext && updateStatus(s)}
                disabled={!isNext && !isActive}
                title={isNext ? `Mark as ${statusFlowLabel(s, record.gives_live_birth)}` : undefined}
              >
                <span className="pipeline-dot" />
                <span className="pipeline-label">{statusFlowLabel(s, record.gives_live_birth)}</span>
              </button>
              {i < STATUS_FLOW.length - 1 && <div className={`pipeline-connector ${isComplete ? 'complete' : ''}`} />}
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Key dates ────────────────────────────────────────── */}
      <div className="grid-4" style={{ margin: '1.25rem 0' }}>
        <StatTile label="First paired"     value={formatDate(record.first_pairing_date) || '—'} />
        <StatTile label="Lock confirmed"   value={formatDate(record.lock_date) || '—'} />
        <StatTile label="Ovulation"        value={formatDate(record.confirmed_ovulation_date) || '—'} />
        <StatTile label="Pre-lay shed"     value={formatDate(record.pre_lay_shed_date) || '—'} />
      </div>

      {/* ── Clutches ─────────────────────────────────────────── */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3>Clutches</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowClutchForm(true)}>+ Add Clutch</button>
        </div>

        {record.clutches?.length === 0
          ? <EmptyState icon="🥚" title="No clutches recorded" message="Add a clutch once eggs are laid." />
          : record.clutches?.map(c => (
              <ClutchCard key={c.id} clutch={c} breedingId={id} onUpdate={refetch} />
            ))
        }
      </div>

      {/* ── Pairing events ───────────────────────────────────── */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3>Pairing events</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPairingForm(true)}>+ Log pairing</button>
        </div>
        {record.pairing_events?.length === 0
          ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No individual pairing events logged.</p>
          : <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead><tr><th>Date</th><th>Duration</th><th>Lock?</th><th>Notes</th></tr></thead>
                <tbody>
                  {record.pairing_events.map(e => (
                    <tr key={e.id}>
                      <td>{formatDateShort(e.paired_at)}</td>
                      <td>{e.duration_minutes ? `${e.duration_minutes} min` : '—'}</td>
                      <td>{e.lock_observed ? '✓ Yes' : '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{e.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* ── Genetics calculator result ───────────────────────── */}
      {showCalcResult && (
        <div className="calc-overlay" onClick={() => setShowCalcResult(null)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '95%' }}>
            <GeneticsResultPanel
              result={showCalcResult}
              maleName={record.male_name}
              femaleName={record.female_name}
              onClose={() => setShowCalcResult(null)}
            />
          </div>
        </div>
      )}

      {showPairingForm && (
        <LogPairingForm
          breedingId={id}
          onClose={() => setShowPairingForm(false)}
          onSaved={() => { setShowPairingForm(false); refetch() }}
        />
      )}

      {/* ── Add clutch form ──────────────────────────────────── */}
      {showClutchForm && (
        <AddClutchForm
          breedingId={id}
          onClose={() => setShowClutchForm(false)}
          onSaved={() => { setShowClutchForm(false); refetch() }}
        />
      )}

      {/* ── Edit dates form ──────────────────────────────────── */}
      {showDateForm && (
        <EditDatesForm
          record={record}
          onClose={() => setShowDateForm(false)}
          onSave={handleDateUpdate}
        />
      )}
    </div>
  )
}

// ── Clutch card ───────────────────────────────────────────────────────────────
function ClutchCard({ clutch: c, breedingId, onUpdate }) {
  const fertile    = (c.total_eggs || 0) - (c.slug_count || 0)
  const successPct = c.total_eggs > 0 ? Math.round((c.hatched_count || 0) / c.total_eggs * 100) : 0
  const [showWizard, setShowWizard] = useState(false)

  // Determine terminology based on is_live_birth flag
  const isLiveBirth = Boolean(c.is_live_birth)
  const eggWord     = isLiveBirth ? 'Young' : 'Eggs'
  const slugWord    = isLiveBirth ? 'Stillborn' : 'Slugs'
  const hatchWord   = isLiveBirth ? 'Born' : 'Hatched'

  return (
    <div className="card clutch-card">
      <div className="clutch-card-header">
        <div>
          <h4 style={{ marginBottom: 4 }}>
            {isLiveBirth ? '🐣 Litter' : '🥚 Clutch'}
          </h4>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            {c.lay_date   && <span>{isLiveBirth ? 'Born' : 'Laid'}: <strong>{formatDate(c.lay_date)}</strong></span>}
            {c.hatch_date && <span>Hatched: <strong>{formatDate(c.hatch_date)}</strong></span>}
            {c.birth_date && <span>Birth date: <strong>{formatDate(c.birth_date)}</strong></span>}
          </div>
        </div>
        <div className="clutch-counts">
          <div className="clutch-stat"><span style={{ fontSize: 22, fontWeight: 700 }}>{c.total_eggs || 0}</span><span>{eggWord}</span></div>
          <div className="clutch-stat"><span style={{ fontSize: 22, fontWeight: 700, color: 'var(--red-text)' }}>{c.slug_count || 0}</span><span>{slugWord}</span></div>
          <div className="clutch-stat"><span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-text)' }}>{c.hatched_count || 0}</span><span>{hatchWord}</span></div>
          {c.hatched_count > 0 && <div className="clutch-stat"><span style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber-text)' }}>{successPct}%</span><span>Success</span></div>}
        </div>
      </div>
      {c.incubation_temp_f && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Incubation: {c.incubation_temp_f}°F{c.incubation_humidity_pct ? `, ${c.incubation_humidity_pct}% humidity` : ''}
          {c.incubator_type ? ` · ${c.incubator_type}` : ''}
        </div>
      )}
      {c.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>{c.notes}</div>}

      {/* Add babies button */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowWizard(true)}>
          🐍 Add babies to collection
        </button>
      </div>

      {showWizard && (
        <AddBabiesWizard
          clutch={c}
          breedingId={breedingId}
          onClose={() => setShowWizard(false)}
          onDone={() => { setShowWizard(false); onUpdate() }}
        />
      )}

      <OffspringPanel clutch={c} onUpdate={onUpdate} />
    </div>
  )
}

// ── Add Babies Wizard ─────────────────────────────────────────────────────────
function AddBabiesWizard({ clutch, breedingId, onClose, onDone }) {
  const { data: speciesList } = useAsync(() => window.api.species.getAll(), [])
  const { data: breedingRecord } = useAsync(() => window.api.breeding.getById(breedingId), [breedingId])
  const speciesId = breedingRecord?.species_id || 'ball_python'

  const { data: morphList } = useAsync(
    () => speciesId ? window.api.morphs.getBySpecies(speciesId) : Promise.resolve([]),
    [speciesId]
  )

  const [babies, setBabies] = useState([])
  const [currentIdx, setCurrentIdx] = useState(null) // null = list view, number = editing that baby
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [errors, setErrors] = useState([])

  const blankBaby = () => ({
    name: '', sex: 'unknown', dob: clutch.hatch_date || clutch.lay_date || '',
    weight_grams: '', notes: '', morphs: [], animal_id: '', idMode: 'auto',
    _tempId: Math.random().toString(36).slice(2),
  })

  const addBaby = () => {
    const nb = blankBaby()
    setBabies(prev => [...prev, nb])
    setCurrentIdx(babies.length)
  }

  const updateBaby = (idx, field, val) => {
    setBabies(prev => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b))
  }

  const removeBaby = (idx) => {
    setBabies(prev => prev.filter((_, i) => i !== idx))
    if (currentIdx === idx) setCurrentIdx(null)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    const errs = []
    let saved = 0
    for (const [i, baby] of babies.entries()) {
      if (!baby.name.trim()) { errs.push(`Baby ${i + 1}: name required`); continue }
      try {
        // First create offspring record
        const offspring = await window.api.offspring.add(clutch.id, {
          sex: baby.sex,
          hatch_date: baby.dob || null,
          hatch_weight_grams: baby.weight_grams ? Number(baby.weight_grams) : null,
          disposition: 'kept',
        })
        // Then convert to full animal
        await window.api.offspring.addToCollection(offspring.id, {
          name:        baby.name,
          sex:         baby.sex,
          dob:         baby.dob || null,
          weight_grams: baby.weight_grams ? Number(baby.weight_grams) : null,
          notes:       baby.notes || null,
          animal_id:   baby.idMode === 'manual' ? baby.animal_id || null : null,
          morphs:      baby.morphs || [],
        })
        saved++
      } catch (e) {
        errs.push(`Baby ${i + 1} (${baby.name}): ${e.message}`)
      }
    }
    setSaving(false)
    setSavedCount(saved)
    setErrors(errs)
    if (saved > 0 && errs.length === 0) onDone()
  }

  const currentBaby = currentIdx !== null ? babies[currentIdx] : null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', width: 640, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginBottom: 2 }}>Add babies to collection</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Step through each baby and set their details. Parents are linked automatically.
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {currentBaby === null ? (
            // ── List view ──────────────────────────────────────────────────────
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {babies.length === 0 ? 'No babies added yet' : `${babies.length} baby${babies.length !== 1 ? 'ies' : ''} ready to add`}
                </span>
                <button className="btn btn-primary btn-sm" onClick={addBaby}>+ Add baby</button>
              </div>

              {babies.map((b, i) => (
                <div key={b._tempId} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 8,
                }}>
                  <span style={{ fontSize: 18 }}>{b.sex === 'male' ? '♂' : b.sex === 'female' ? '♀' : '?'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{b.name || <em style={{ color: 'var(--text-muted)' }}>Unnamed</em>}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {b.morphs?.length > 0 ? b.morphs.map(m => m.morph_name).join(', ') : 'Normal'}
                      {b.weight_grams ? ` · ${b.weight_grams}g` : ''}
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentIdx(i)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} onClick={() => removeBaby(i)}>✕</button>
                </div>
              ))}

              {errors.length > 0 && (
                <div style={{ background: 'var(--red-dim)', color: 'var(--red-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginTop: 12, fontSize: 13 }}>
                  {errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
              {savedCount > 0 && (
                <div style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginTop: 12, fontSize: 13 }}>
                  ✓ {savedCount} animal{savedCount !== 1 ? 's' : ''} added to collection!
                </div>
              )}
            </div>
          ) : (
            // ── Baby edit view ──────────────────────────────────────────────────
            <BabyForm
              baby={currentBaby}
              morphList={morphList || []}
              onChange={(field, val) => updateBaby(currentIdx, field, val)}
              onBack={() => setCurrentIdx(null)}
              onNext={() => {
                if (currentIdx < babies.length - 1) setCurrentIdx(currentIdx + 1)
                else setCurrentIdx(null)
              }}
              isLast={currentIdx === babies.length - 1}
              number={currentIdx + 1}
              total={babies.length}
            />
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {currentBaby === null && babies.length > 0 && (
            <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving}>
              {saving ? 'Saving…' : `Add ${babies.length} baby${babies.length !== 1 ? 'ies' : ''} to collection`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BabyForm({ baby, morphList, onChange, onBack, onNext, isLast, number, total }) {
  const [morphSearch, setMorphSearch] = useState('')
  const set = (k, v) => onChange(k, v)

  const filteredMorphs = (morphList || []).filter(m =>
    !baby.morphs?.find(s => s.morph_id === m.id) &&
    (!morphSearch || m.name.toLowerCase().includes(morphSearch.toLowerCase()))
  )

  const addMorph = (m) => set('morphs', [...(baby.morphs || []), { morph_id: m.id, morph_name: m.name, expression: 'visual', het_percent: null }])
  const removeMorph = (mid) => set('morphs', (baby.morphs || []).filter(m => m.morph_id !== mid))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4>Baby {number} of {total}</h4>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to list</button>
      </div>

      <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" value={baby.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Hatchling #1, Ghost Jr." />
        </div>
        <div className="form-group">
          <label className="form-label">Sex</label>
          <div className="radio-group">
            {['male','female','unknown'].map(s => (
              <label key={s} className={`radio-btn ${baby.sex === s ? 'selected' : ''}`}>
                <input type="radio" checked={baby.sex === s} onChange={() => set('sex', s)} />
                {s === 'male' ? '♂' : s === 'female' ? '♀' : '?'}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Hatch / Birth date</label>
          <input type="date" className="form-input" value={baby.dob} onChange={e => set('dob', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Weight (grams)</label>
          <input type="number" className="form-input" value={baby.weight_grams} onChange={e => set('weight_grams', e.target.value)} placeholder="Hatch weight" min="0" />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 14 }}>
        <label className="form-label">Notes</label>
        <input className="form-input" value={baby.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this baby" />
      </div>

      <div className="form-group" style={{ marginBottom: 14 }}>
        <label className="form-label">Animal ID</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {['auto', 'manual'].map(m => (
            <label key={m} className={`radio-btn ${baby.idMode === m ? 'selected' : ''}`} style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
              <input type="radio" checked={baby.idMode === m} onChange={() => set('idMode', m)} />
              {m === 'auto' ? '⚡ Auto' : '✏️ Manual'}
            </label>
          ))}
        </div>
        {baby.idMode === 'manual' && (
          <input className="form-input" value={baby.animal_id} onChange={e => set('animal_id', e.target.value)} placeholder="Custom ID" style={{ fontFamily: 'var(--font-mono)' }} />
        )}
      </div>

      {/* Morphs */}
      <div className="form-group">
        <label className="form-label">Morphs</label>
        {(baby.morphs || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {baby.morphs.map(m => (
              <span key={m.morph_id} style={{
                background: 'var(--accent-dim)', color: 'var(--accent-text)',
                border: '1px solid var(--accent)', borderRadius: 12, padding: '2px 10px', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {m.morph_name}
                <button onClick={() => removeMorph(m.morph_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        )}
        <input className="form-input" placeholder="Search morphs to add…" value={morphSearch}
          onChange={e => setMorphSearch(e.target.value)} style={{ marginBottom: 6 }} />
        {morphSearch && (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: 160, overflowY: 'auto' }}>
            {filteredMorphs.slice(0, 20).map(m => (
              <button key={m.id} onClick={() => { addMorph(m); setMorphSearch('') }}
                style={{ width: '100%', textAlign: 'left', padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                {m.name}
              </button>
            ))}
            {filteredMorphs.length === 0 && <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 13 }}>No morphs found</div>}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={onNext}>
          {isLast ? 'Done ✓' : `Next baby →`}
        </button>
      </div>
    </div>
  )
}

// ── Add clutch form ───────────────────────────────────────────────────────────
function AddClutchForm({ breedingId, onClose, onSaved }) {
  const [form, setForm]   = useState({ lay_date: '', hatch_date: '', total_eggs: '', slug_count: '', hatched_count: '', incubation_temp_f: '', incubation_humidity_pct: '', incubator_type: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.api.clutches.create({
        breeding_record_id: breedingId,
        ...form,
        total_eggs:     Number(form.total_eggs)     || 0,
        slug_count:     Number(form.slug_count)     || 0,
        hatched_count:  form.hatched_count ? Number(form.hatched_count) : null,
        incubation_temp_f: form.incubation_temp_f ? Number(form.incubation_temp_f) : null,
        incubation_humidity_pct: form.incubation_humidity_pct ? Number(form.incubation_humidity_pct) : null,
        lay_date:   form.lay_date   || null,
        hatch_date: form.hatch_date || null,
      })
      onSaved()
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="calc-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: 500, width: '95%' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>Add clutch</h3>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Lay date</label><input type="date" className="form-input" value={form.lay_date} onChange={e => set('lay_date', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Hatch date</label><input type="date" className="form-input" value={form.hatch_date} onChange={e => set('hatch_date', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Total eggs</label><input type="number" className="form-input" value={form.total_eggs} onChange={e => set('total_eggs', e.target.value)} min="0" /></div>
          <div className="form-group"><label className="form-label">Slugs</label><input type="number" className="form-input" value={form.slug_count} onChange={e => set('slug_count', e.target.value)} min="0" /></div>
          <div className="form-group"><label className="form-label">Hatched</label><input type="number" className="form-input" value={form.hatched_count} onChange={e => set('hatched_count', e.target.value)} min="0" /></div>
          <div className="form-group"><label className="form-label">Temp (°F)</label><input type="number" className="form-input" value={form.incubation_temp_f} onChange={e => set('incubation_temp_f', e.target.value)} placeholder="88.5" /></div>
          <div className="form-group"><label className="form-label">Humidity (%)</label><input type="number" className="form-input" value={form.incubation_humidity_pct} onChange={e => set('incubation_humidity_pct', e.target.value)} placeholder="90" /></div>
          <div className="form-group"><label className="form-label">Incubator</label><input className="form-input" value={form.incubator_type} onChange={e => set('incubator_type', e.target.value)} placeholder="e.g. Reptibator" /></div>
        </div>
        <div className="form-group" style={{ marginTop: 10 }}><label className="form-label">Notes</label><textarea className="form-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add clutch'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Edit dates form ───────────────────────────────────────────────────────────
function EditDatesForm({ record, onClose, onSave }) {
  const [form, setForm] = useState({
    first_pairing_date:       record.first_pairing_date?.slice(0,10) || '',
    last_pairing_date:        record.last_pairing_date?.slice(0,10)  || '',
    lock_date:                record.lock_date?.slice(0,10)           || '',
    confirmed_ovulation_date: record.confirmed_ovulation_date?.slice(0,10) || '',
    pre_lay_shed_date:        record.pre_lay_shed_date?.slice(0,10)  || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="calc-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: 420, width: '95%' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>Edit key dates</h3>
        {[
          ['first_pairing_date', 'First pairing'],
          ['last_pairing_date', 'Last pairing'],
          ['lock_date', 'Lock observed'],
          ['confirmed_ovulation_date', 'Ovulation confirmed'],
          ['pre_lay_shed_date', 'Pre-lay shed'],
        ].map(([key, label]) => (
          <div className="form-group" key={key} style={{ marginBottom: 10 }}>
            <label className="form-label">{label}</label>
            <input type="date" className="form-input" value={form[key]} onChange={e => set(key, e.target.value)} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save dates</button>
        </div>
      </div>
    </div>
  )
}

// ── Genetics result panel ────────────────────────────────────────────────────
function GeneticsResultPanel({ result, maleName, femaleName, onClose }) {
  const { outcomes = [], healthWarnings = [], summary = {} } = result

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>🧬 Offspring outcomes — {maleName} × {femaleName}</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
      </div>

      {healthWarnings?.length > 0 && (
        <div style={{ background: 'var(--amber-dim)', color: 'var(--amber-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 14 }}>
          ⚠ <strong>Health concern{healthWarnings.length > 1 ? 's' : ''}:</strong>{' '}
          {healthWarnings.map(w => `${w.morphName}: ${w.description}`).join(' · ')}
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <StatTile label="Possible outcomes" value={summary.totalOutcomes || 0} />
        <StatTile label="Morph offspring"   value={`${summary.morphPercent?.toFixed(0) || 0}%`} color="var(--accent-text)" />
        <StatTile label="Normal offspring"  value={`${summary.normalPercent?.toFixed(0) || 0}%`} />
        <StatTile label="Visual combos"     value={summary.uniqueVisuals || 0} color="var(--blue-text)" />
      </div>

      <div className="calc-outcomes">
        {outcomes.map((o, i) => (
          <div key={i} className={`outcome-row ${o.hasHealthConcern ? 'outcome-health' : ''}`}>
            <div className="outcome-pct">{(o.probability * 100).toFixed(1)}%</div>
            <div className="outcome-bar-wrap">
              <div className="outcome-bar" style={{ width: `${o.probability * 100}%` }} />
            </div>
            <div className="outcome-label">
              {o.label}
              {o.hasHealthConcern && <span style={{ color: 'var(--amber-text)', marginLeft: 6 }}>⚠</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Log Pairing Form ──────────────────────────────────────────────────────────
function LogPairingForm({ breedingId, onClose, onSaved }) {
  const [form, setForm] = React.useState({
    paired_at:        new Date().toISOString().slice(0, 10),
    duration_minutes: '',
    lock_observed:    false,
    notes:            '',
  })
  const [saving, setSaving] = React.useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.api.pairingEvents.add(breedingId, form)
      onSaved()
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  return (
    <div className="calc-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: 400, width: '95%' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>Log pairing event</h3>

        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.paired_at}
            onChange={e => set('paired_at', e.target.value)} />
        </div>

        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="form-label">Duration (minutes)</label>
          <input type="number" className="form-input" value={form.duration_minutes}
            onChange={e => set('duration_minutes', e.target.value)} placeholder="Optional" min="0" />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.lock_observed}
            onChange={e => set('lock_observed', e.target.checked)} />
          Lock observed
        </label>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Notes</label>
          <input className="form-input" value={form.notes}
            onChange={e => set('notes', e.target.value)} placeholder="Optional" />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Log pairing'}
          </button>
        </div>
      </div>
    </div>
  )
}
