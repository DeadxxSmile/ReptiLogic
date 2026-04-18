import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimal, useSpecies, useMorphs, useAnimals } from '../hooks/useData'
import { MorphTag, LoadingSpinner, PageError } from '../components/shared'
import { inheritanceLabel, expressionLabel } from '../utils/format'
import './AddAnimalPage.css'

export default function AddAnimalPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const { data: existingAnimal, loading: animalLoading } = useAnimal(id)
  const { data: speciesList,    loading: speciesLoading } = useSpecies()
  const { data: allAnimals }                              = useAnimals()

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [photos,  setPhotos]  = useState([])

  // ── Animal ID ────────────────────────────────────────────────────────────────
  const [idMode,    setIdMode]    = useState('auto')
  const [previewId, setPreviewId] = useState('')
  const [manualId,  setManualId]  = useState('')

  // ── Parents (lineage) ────────────────────────────────────────────────────────
  const [fatherId, setFatherId] = useState('')
  const [motherId, setMotherId] = useState('')

  // ── Sex-linked maker type (Banana/Coral Glow males) ──────────────────────────
  const [makerType, setMakerType] = useState('')

  // ── Health at intake ─────────────────────────────────────────────────────────
  const [healthIssues,      setHealthIssues]      = useState([])
  const [initialMeds,       setInitialMeds]        = useState([])
  const [initialWeight,     setInitialWeight]      = useState('')
  const [showHealthSection, setShowHealthSection]  = useState(false)

  // ── Form state ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:              '',
    species_id:        'ball_python',
    sex:               'unknown',
    dob:               '',
    dob_estimated:     false,
    weight_grams:      '',
    acquired_date:     '',
    acquired_from:     '',
    acquisition_price: '',
    status:            'active',
    notes:             '',
  })

  const [selectedMorphs,  setSelectedMorphs]  = useState([])
  const [morphSearch,     setMorphSearch]     = useState('')
  const [morphCategory,   setMorphCategory]   = useState('all')

  const { data: morphList } = useMorphs(form.species_id)

  // ── Load settings for ID mode default ───────────────────────────────────────
  useEffect(() => {
    window.api.settings.getAll().then(s => {
      if (s?.animal_id_mode === 'manual') setIdMode('manual')
    }).catch(() => {})
  }, [])

  // ── Preview auto-ID whenever key fields change ───────────────────────────────
  useEffect(() => {
    if (isEdit || idMode !== 'auto') return
    window.api.animals.previewId(form.species_id, form.sex, selectedMorphs)
      .then(setPreviewId)
      .catch(() => {})
  }, [form.species_id, form.sex, selectedMorphs, idMode, isEdit])

  // ── Populate for edit ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !existingAnimal) return
    setForm({
      name:              existingAnimal.name || '',
      species_id:        existingAnimal.species_id || 'ball_python',
      sex:               existingAnimal.sex || 'unknown',
      dob:               existingAnimal.dob?.slice(0, 10) || '',
      dob_estimated:     Boolean(existingAnimal.dob_estimated),
      weight_grams:      existingAnimal.weight_grams || '',
      acquired_date:     existingAnimal.acquired_date?.slice(0, 10) || '',
      acquired_from:     existingAnimal.acquired_from || '',
      acquisition_price: existingAnimal.acquisition_price || '',
      status:            existingAnimal.status || 'active',
      notes:             existingAnimal.notes || '',
    })
    setManualId(existingAnimal.animal_id || '')
    setIdMode(existingAnimal.animal_id ? 'manual' : 'auto')
    setFatherId(existingAnimal.father_id || '')
    setMotherId(existingAnimal.mother_id || '')
    setMakerType(existingAnimal.sex_linked_maker || '')
    setSelectedMorphs((existingAnimal.morphs || []).map(m => ({
      morph_id:           m.morph_id,
      morph_name:         m.morph_name,
      inheritance_type:   m.inheritance_type,
      super_form_name:    m.super_form_name,
      has_health_concern: m.has_health_concern,
      expression:         m.expression,
      het_percent:        m.het_percent,
    })))
  }, [existingAnimal, isEdit])

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handlePhotos = async () => {
    const chosen = await window.api.photos.choose()
    if (chosen?.length) setPhotos(p => [...p, ...chosen.map(c => ({ ...c, isNew: true }))])
  }

  // ── Morph management ─────────────────────────────────────────────────────────
  const filteredMorphList = (morphList || []).filter(m => {
    const inSearch = !morphSearch ||
      m.name.toLowerCase().includes(morphSearch.toLowerCase()) ||
      m.gene_symbol?.toLowerCase().includes(morphSearch.toLowerCase())
    const inCat    = morphCategory === 'all' || m.category === morphCategory
    const notSel   = !selectedMorphs.find(s => s.morph_id === m.id)
    return inSearch && inCat && notSel
  })
  const morphCategories = ['all', ...new Set((morphList || []).map(m => m.category).filter(Boolean))]

  const addMorph = (morph) => {
    setSelectedMorphs(prev => [...prev, {
      morph_id:           morph.id,
      morph_name:         morph.name,
      inheritance_type:   morph.inheritance_type,
      super_form_name:    morph.super_form_name,
      has_health_concern: morph.has_health_concern,
      expression:         'visual',
      het_percent:        null,
    }])
    setMorphSearch('')
  }
  const removeMorph = (morphId) => setSelectedMorphs(prev => prev.filter(m => m.morph_id !== morphId))
  const updateMorphExpression = (morphId, expression) =>
    setSelectedMorphs(prev => prev.map(m => m.morph_id === morphId ? { ...m, expression } : m))
  const updateMorphHetPct = (morphId, pct) =>
    setSelectedMorphs(prev => prev.map(m => m.morph_id === morphId ? { ...m, het_percent: pct } : m))

  // ── Parent picker helpers ─────────────────────────────────────────────────────
  const maleOptions   = (allAnimals || []).filter(a => a.sex === 'male'   && a.species_id === form.species_id && a.id !== id)
  const femaleOptions = (allAnimals || []).filter(a => a.sex === 'female' && a.species_id === form.species_id && a.id !== id)

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }

    setSaving(true)
    setError(null)
    try {
      const finalAnimalId = idMode === 'manual' ? (manualId.trim() || null) : null  // null = auto-generate in backend

      const payload = {
        ...form,
        animal_id:         finalAnimalId,
        weight_grams:      form.weight_grams      ? Number(form.weight_grams)      : null,
        acquisition_price: form.acquisition_price ? Number(form.acquisition_price) : null,
        dob:               form.dob || null,
        acquired_date:     form.acquired_date || null,
        father_id:         fatherId || null,
        mother_id:         motherId || null,
        sex_linked_maker:  makerType || null,
        morphs: selectedMorphs.map(m => ({
          morph_id:    m.morph_id,
          expression:  m.expression,
          het_percent: m.het_percent,
        })),
      }

      let animal
      if (isEdit) {
        animal = await window.api.animals.update(id, payload)
      } else {
        animal = await window.api.animals.create(payload)
      }

      if (photos.filter(p => p.isNew).length > 0) {
        await window.api.photos.save(animal.id, photos.filter(p => p.isNew))
      }

      if (initialWeight && !isEdit) {
        await window.api.measurements.add(animal.id, {
          weight_grams: Number(initialWeight),
          measured_at:  new Date().toISOString().slice(0, 10),
          notes: 'Initial weight at intake',
        })
      }

      for (const issue of healthIssues) {
        if (issue.title?.trim()) await window.api.health.addIssue(animal.id, issue)
      }
      for (const med of initialMeds) {
        if (med.name?.trim()) await window.api.health.addMedication(animal.id, { ...med, active: 1 })
      }

      navigate(`/collection/${animal.id}`)
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if ((isEdit && animalLoading) || speciesLoading) return <LoadingSpinner />

  return (
    <div className="add-animal-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <h1>{isEdit ? `Edit ${existingAnimal?.name || 'Animal'}` : 'Add Animal'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Animal'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', color: 'var(--red-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="add-animal-layout">

        {/* ── Left column ─────────────────────────────────── */}
        <div className="add-animal-main">

          {/* Basic info */}
          <div className="card section">
            <h3 style={{ marginBottom: 16 }}>Basic information</h3>
            <div className="grid-2" style={{ gap: 14 }}>

              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sable, Ghost, Princess" />
              </div>

              <div className="form-group">
                <label className="form-label">Species *</label>
                <select className="form-select" value={form.species_id} onChange={e => { set('species_id', e.target.value); setSelectedMorphs([]) }}>
                  {(speciesList || []).map(s => (
                    <option key={s.id} value={s.id}>{s.common_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sex</label>
                <div className="radio-group">
                  {['male', 'female', 'unknown'].map(s => (
                    <label key={s} className={`radio-btn ${form.sex === s ? 'selected' : ''}`}>
                      <input type="radio" name="sex" value={s} checked={form.sex === s} onChange={() => set('sex', s)} />
                      {s === 'male' ? '♂ Male' : s === 'female' ? '♀ Female' : '? Unknown'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="deceased">Deceased</option>
                  <option value="on_loan">On Loan</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of birth</label>
                <input type="date" className="form-input" value={form.dob} onChange={e => set('dob', e.target.value)} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.dob_estimated} onChange={e => set('dob_estimated', e.target.checked)} />
                  Estimated date
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Weight (grams)</label>
                <input type="number" className="form-input" value={form.weight_grams} onChange={e => set('weight_grams', e.target.value)} placeholder="e.g. 1450" min="0" />
              </div>

              <div className="form-group">
                <label className="form-label">Acquired date</label>
                <input type="date" className="form-input" value={form.acquired_date} onChange={e => set('acquired_date', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Acquired from</label>
                <input className="form-input" value={form.acquired_from} onChange={e => set('acquired_from', e.target.value)} placeholder="Breeder name or source" />
              </div>

              <div className="form-group">
                <label className="form-label">Purchase price ($)</label>
                <input type="number" className="form-input" value={form.acquisition_price} onChange={e => set('acquisition_price', e.target.value)} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" rows={3} />
            </div>
          </div>

          {/* ── Animal ID ──────────────────────────────────── */}
          <div className="card section">
            <h3 style={{ marginBottom: 4 }}>Animal ID *</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              A unique identifier for tracking. Auto-generate uses species, sex, count, and morphs.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['auto', 'manual'].map(m => (
                <label key={m} className={`radio-btn ${idMode === m ? 'selected' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
                  <input type="radio" name="idMode" value={m} checked={idMode === m} onChange={() => setIdMode(m)} />
                  {m === 'auto' ? '⚡ Auto-generate' : '✏️ Manual'}
                </label>
              ))}
            </div>
            {idMode === 'auto' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="form-input" style={{ flex: 1, background: 'var(--surface-2)', color: 'var(--accent-text)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                  {previewId || '—'}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>preview</span>
              </div>
            ) : (
              <input
                className="form-input"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                placeholder="Enter your ID (e.g. BP-2024-001, SBL-F-07)"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            )}
          </div>

          {/* ── Lineage / Parents ─────────────────────────── */}
          <div className="card section">
            <h3 style={{ marginBottom: 4 }}>Lineage</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Link this animal's parents for full lineage tracking. Used in husbandry reports.
            </p>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">♂ Sire (Father)</label>
                <select className="form-select" value={fatherId} onChange={e => setFatherId(e.target.value)}>
                  <option value="">— Unknown / Not in collection —</option>
                  {maleOptions.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.animal_id ? ` (${a.animal_id})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">♀ Dam (Mother)</label>
                <select className="form-select" value={motherId} onChange={e => setMotherId(e.target.value)}>
                  <option value="">— Unknown / Not in collection —</option>
                  {femaleOptions.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.animal_id ? ` (${a.animal_id})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Maker type — only shown for males carrying Banana / Coral Glow */}
            {form.sex === 'male' && selectedMorphs.some(m =>
              m.morph_id === 'bp_banana' || m.morph_id === 'bp_coral_glow' ||
              m.morph_name?.toLowerCase().includes('banana') ||
              m.morph_name?.toLowerCase().includes('coral glow')
            ) && (
              <div className="form-group" style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <label className="form-label">🍌 Banana / Coral Glow maker type</label>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Male Banana/Coral Glow snakes are either <strong>Male Makers</strong> (their Banana parent was male — ~93% of their Banana offspring will be male)
                  or <strong>Female Makers</strong> (their Banana parent was female — ~93% of Banana offspring will be female).
                  This is critical for planning pairings and predicting sex ratios.
                </p>
                <select className="form-select" style={{ maxWidth: 340 }} value={makerType} onChange={e => setMakerType(e.target.value)}>
                  <option value="">Unknown / not recorded</option>
                  <option value="male_maker">Male Maker (~93% male Banana offspring)</option>
                  <option value="female_maker">Female Maker (~93% female Banana offspring)</option>
                </select>
              </div>
            )}
          </div>

          {/* ── Photos ────────────────────────────────────── */}
          <div className="card section">
            <h3 style={{ marginBottom: 12 }}>Photos</h3>
            <div className="photo-grid">
              {photos.map((p, i) => (
                <PhotoPreviewThumb key={i} photo={p} onRemove={() => setPhotos(ps => ps.filter((_, j) => j !== i))} />
              ))}
              <button className="photo-add-btn" onClick={handlePhotos}>
                <span>+</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Add photos</span>
              </button>
            </div>
          </div>

          {/* ── Health at intake ──────────────────────────── */}
          <div className="card section">
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowHealthSection(v => !v)}
            >
              <div>
                <h3>Health at intake</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Optional — log known conditions, medications, and initial weight</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 18, userSelect: 'none' }}>{showHealthSection ? '▾' : '▸'}</span>
            </div>

            {showHealthSection && (
              <div style={{ marginTop: 16 }}>
                <div className="form-group" style={{ maxWidth: 200, marginBottom: 20 }}>
                  <label className="form-label">Initial weight (grams)</label>
                  <input type="number" className="form-input" value={initialWeight} onChange={e => setInitialWeight(e.target.value)} placeholder="e.g. 65" min="0" />
                  <span className="form-hint">Saved as a measurement entry on creation</span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Known health issues</label>
                    <button className="btn btn-secondary btn-sm" onClick={() =>
                      setHealthIssues(prev => [...prev, { title: '', category: 'general', severity: 'minor', onset_date: '', description: '', treatment: '' }])
                    }>+ Add issue</button>
                  </div>
                  {healthIssues.length === 0
                    ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No issues recorded.</p>
                    : healthIssues.map((issue, i) => (
                        <IntakeIssueRow key={i} issue={issue}
                          onChange={u => setHealthIssues(prev => prev.map((h, j) => j === i ? u : h))}
                          onRemove={() => setHealthIssues(prev => prev.filter((_, j) => j !== i))}
                        />
                      ))
                  }
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Current medications</label>
                    <button className="btn btn-secondary btn-sm" onClick={() =>
                      setInitialMeds(prev => [...prev, { name: '', dosage: '', frequency: '', route: 'oral', start_date: '', prescribed_by: '', reason: '' }])
                    }>+ Add medication</button>
                  </div>
                  {initialMeds.length === 0
                    ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No medications recorded.</p>
                    : initialMeds.map((med, i) => (
                        <IntakeMedRow key={i} med={med}
                          onChange={u => setInitialMeds(prev => prev.map((m, j) => j === i ? u : m))}
                          onRemove={() => setInitialMeds(prev => prev.filter((_, j) => j !== i))}
                        />
                      ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: morphs ─────────────────────────── */}
        <div className="add-animal-morphs">
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            <h3 style={{ marginBottom: 4 }}>Morphs & Genes</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Add all genes this animal carries — visuals, hets, and possible hets.
            </p>

            {selectedMorphs.length > 0 && (
              <div className="selected-morphs">
                {selectedMorphs.map(m => (
                  <SelectedMorphRow
                    key={m.morph_id} morph={m}
                    onRemove={() => removeMorph(m.morph_id)}
                    onExpressionChange={(e) => updateMorphExpression(m.morph_id, e)}
                    onHetPctChange={(p) => updateMorphHetPct(m.morph_id, p)}
                  />
                ))}
              </div>
            )}

            <div className="morph-picker">
              <input className="form-input" placeholder="Search morphs…" value={morphSearch}
                onChange={e => setMorphSearch(e.target.value)} style={{ marginBottom: 8 }} />
              <div className="morph-category-tabs">
                {morphCategories.map(cat => (
                  <button key={cat} className={`filter-btn ${morphCategory === cat ? 'active' : ''}`}
                    onClick={() => setMorphCategory(cat)} style={{ fontSize: 11 }}>
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
              <div className="morph-list">
                {filteredMorphList.slice(0, 50).map(morph => (
                  <button key={morph.id} className="morph-list-item" onClick={() => addMorph(morph)} title={morph.description}>
                    <span className="morph-list-name">{morph.name}</span>
                    <span className={`badge badge-${morph.inheritance_type}`} style={{ fontSize: 10 }}>
                      {inheritanceLabel(morph.inheritance_type)}
                    </span>
                    {morph.has_health_concern === 1 && <span style={{ color: 'var(--amber-text)', fontSize: 11 }}>⚠</span>}
                  </button>
                ))}
                {filteredMorphList.length === 0 && (
                  <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>No morphs found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhotoPreviewThumb({ photo, onRemove }) {
  const [src, setSrc] = React.useState(null)
  React.useEffect(() => {
    if (photo.local_path) setSrc(`file://${photo.local_path}`)
    else if (photo.filename) window.api.photos.getPath(photo.filename).then(p => setSrc(`file://${p}`)).catch(() => {})
  }, [photo])
  return (
    <div className="photo-thumb" style={{ padding: 0, overflow: 'hidden' }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: 6, textAlign: 'center', wordBreak: 'break-all' }}>{photo.original_name || photo.filename}</span>
      }
      <button className="photo-remove" onClick={onRemove}>×</button>
    </div>
  )
}

function SelectedMorphRow({ morph, onRemove, onExpressionChange, onHetPctChange }) {
  const expressionOptions = morph.inheritance_type === 'recessive'
    ? [{ value: 'visual', label: 'Visual' }, { value: 'proven_het', label: 'Proven Het' }, { value: 'het', label: 'Het' }, { value: 'possible_het', label: 'Possible Het' }]
    : morph.inheritance_type === 'co_dominant' || morph.inheritance_type === 'dominant'
    ? [{ value: 'visual', label: 'Single copy (visual)' }, { value: 'super', label: morph.super_form_name || 'Super / Homozygous' }]
    : [{ value: 'visual', label: 'Expresses' }, { value: 'het', label: 'Carries (non-visual)' }]
  return (
    <div className="selected-morph-row">
      {morph.has_health_concern === 1 && <span title="Health concern" style={{ color: 'var(--amber-text)', fontSize: 13 }}>⚠</span>}
      <span className="selected-morph-name">{morph.morph_name}</span>
      <select className="form-select" style={{ fontSize: 11, padding: '3px 6px', height: 'auto', width: 'auto', flex: 1 }}
        value={morph.expression} onChange={e => onExpressionChange(e.target.value)}>
        {expressionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {morph.expression === 'possible_het' && (
        <select className="form-select" style={{ fontSize: 11, padding: '3px 6px', height: 'auto', width: 70 }}
          value={morph.het_percent || 50} onChange={e => onHetPctChange(Number(e.target.value))}>
          {[25, 50, 66, 75].map(p => <option key={p} value={p}>{p}%</option>)}
        </select>
      )}
      <button className="btn btn-ghost btn-sm" onClick={onRemove} style={{ padding: '2px 6px', color: 'var(--text-muted)' }}>×</button>
    </div>
  )
}

function IntakeIssueRow({ issue, onChange, onRemove }) {
  const set = (k, v) => onChange({ ...issue, [k]: v })
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input className="form-input" style={{ flex: 2, minWidth: 160 }} value={issue.title} onChange={e => set('title', e.target.value)} placeholder="Condition / issue name *" />
        <select className="form-select" style={{ flex: 1, minWidth: 120 }} value={issue.category} onChange={e => set('category', e.target.value)}>
          {['general','injury','infection','parasite','respiratory','neurological','digestive','shed','other'].map(c =>
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select className="form-select" style={{ flex: 1, minWidth: 110 }} value={issue.severity} onChange={e => set('severity', e.target.value)}>
          {['minor','moderate','serious','critical'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={onRemove} style={{ color: 'var(--text-muted)' }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="form-input" style={{ flex: 1 }} value={issue.description} onChange={e => set('description', e.target.value)} placeholder="Description / symptoms" />
        <input className="form-input" style={{ flex: 1 }} value={issue.treatment} onChange={e => set('treatment', e.target.value)} placeholder="Treatment / action taken" />
      </div>
    </div>
  )
}

function IntakeMedRow({ med, onChange, onRemove }) {
  const set = (k, v) => onChange({ ...med, [k]: v })
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input className="form-input" style={{ flex: 2, minWidth: 160 }} value={med.name} onChange={e => set('name', e.target.value)} placeholder="Medication name *" />
        <input className="form-input" style={{ flex: 1, minWidth: 110 }} value={med.dosage} onChange={e => set('dosage', e.target.value)} placeholder="Dosage" />
        <input className="form-input" style={{ flex: 1, minWidth: 140 }} value={med.frequency} onChange={e => set('frequency', e.target.value)} placeholder="Frequency" />
        <select className="form-select" style={{ minWidth: 110 }} value={med.route} onChange={e => set('route', e.target.value)}>
          {['oral','topical','injection','nebulisation','other'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={onRemove} style={{ color: 'var(--text-muted)' }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="form-input" style={{ flex: 1 }} value={med.prescribed_by} onChange={e => set('prescribed_by', e.target.value)} placeholder="Prescribed by" />
        <input className="form-input" style={{ flex: 1 }} value={med.reason} onChange={e => set('reason', e.target.value)} placeholder="Reason / condition" />
      </div>
    </div>
  )
}
