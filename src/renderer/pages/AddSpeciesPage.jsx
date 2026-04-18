import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSpecies } from '../hooks/useData'
import { LoadingSpinner } from '../components/shared'
import './AddAnimalPage.css'

export default function AddSpeciesPage() {
  const navigate      = useNavigate()
  const [params]      = useSearchParams()
  const editId        = params.get('edit')
  const { data: speciesList, loading } = useSpecies()

  const existing = editId && speciesList ? speciesList.find(s => s.id === editId) : null
  const isEdit   = Boolean(existing)

  const [form, setForm] = useState({
    id:                  '',
    common_name:         '',
    scientific_name:     '',
    gives_live_birth:    false,
    avg_clutch_size:     '',
    litter_size_min:     '',
    litter_size_max:     '',
    incubation_days_min: '',
    incubation_days_max: '',
    notes:               '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      setForm({
        id:                  existing.id || '',
        common_name:         existing.common_name || '',
        scientific_name:     existing.scientific_name || '',
        gives_live_birth:    Boolean(existing.gives_live_birth),
        avg_clutch_size:     existing.avg_clutch_size || '',
        litter_size_min:     existing.litter_size_min || '',
        litter_size_max:     existing.litter_size_max || '',
        incubation_days_min: existing.incubation_days_min || '',
        incubation_days_max: existing.incubation_days_max || '',
        notes:               existing.notes || '',
      })
    }
  }, [existing?.id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.common_name.trim()) { setError('Common name is required.'); return }
    if (!isEdit && !form.id.trim()) { setError('Species ID is required (e.g. ball_python).'); return }

    setSaving(true)
    setError(null)
    try {
      await window.api.settings.set('_species_upsert', JSON.stringify({
        id:                  isEdit ? existing.id : form.id.trim().toLowerCase().replace(/\s+/g, '_'),
        common_name:         form.common_name.trim(),
        scientific_name:     form.scientific_name.trim() || null,
        gives_live_birth:    form.gives_live_birth ? 1 : 0,
        avg_clutch_size:     form.avg_clutch_size     ? Number(form.avg_clutch_size)     : null,
        litter_size_min:     form.litter_size_min     ? Number(form.litter_size_min)     : null,
        litter_size_max:     form.litter_size_max     ? Number(form.litter_size_max)     : null,
        incubation_days_min: form.incubation_days_min ? Number(form.incubation_days_min) : null,
        incubation_days_max: form.incubation_days_max ? Number(form.incubation_days_max) : null,
        notes:               form.notes.trim() || null,
      }))
      navigate('/library')
    } catch (e) {
      setError(e.message || 'Could not save species.')
      setSaving(false)
    }
  }

  if (loading && editId) return <LoadingSpinner label="Loading species…" />

  return (
    <div className="add-animal-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/library')}>← Back</button>
          <h1>{isEdit ? `Edit ${existing?.common_name}` : 'Add Species'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/library')} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add species'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', color: 'var(--red-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="add-animal-layout">
        <div className="add-animal-main">

          {/* ── Identity ───────────────────────────────────────── */}
          <div className="card section">
            <h3 style={{ marginBottom: 16 }}>Species details</h3>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Common name *</label>
                <input className="form-input" value={form.common_name}
                  onChange={e => set('common_name', e.target.value)}
                  placeholder="e.g. Ball Python" />
              </div>

              <div className="form-group">
                <label className="form-label">Species ID *</label>
                <input
                  className="form-input"
                  value={form.id}
                  onChange={e => set('id', e.target.value.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''))}
                  placeholder="e.g. ball_python"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  disabled={isEdit}
                />
                {!isEdit && <span className="form-hint">Lowercase and underscores only. Cannot be changed after saving.</span>}
                {isEdit  && <span className="form-hint">Species ID cannot be changed.</span>}
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Scientific name</label>
                <input className="form-input" value={form.scientific_name}
                  onChange={e => set('scientific_name', e.target.value)}
                  placeholder="e.g. Python regius"
                  style={{ fontStyle: 'italic' }} />
              </div>
            </div>
          </div>

          {/* ── Reproduction ──────────────────────────────────── */}
          <div className="card section">
            <h3 style={{ marginBottom: 16 }}>Reproduction</h3>

            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">Reproduction type</label>
              <div className="radio-group">
                <label className={`radio-btn ${!form.gives_live_birth ? 'selected' : ''}`}>
                  <input type="radio" checked={!form.gives_live_birth} onChange={() => set('gives_live_birth', false)} />
                  🥚 Egg layer (oviparous)
                </label>
                <label className={`radio-btn ${form.gives_live_birth ? 'selected' : ''}`}>
                  <input type="radio" checked={form.gives_live_birth} onChange={() => set('gives_live_birth', true)} />
                  🐣 Live birth (viviparous)
                </label>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 14 }}>
              {form.gives_live_birth ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Min litter size</label>
                    <input type="number" className="form-input" value={form.litter_size_min}
                      onChange={e => set('litter_size_min', e.target.value)} min="0" placeholder="e.g. 4" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max litter size</label>
                    <input type="number" className="form-input" value={form.litter_size_max}
                      onChange={e => set('litter_size_max', e.target.value)} min="0" placeholder="e.g. 20" />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Avg clutch size</label>
                    <input type="number" className="form-input" value={form.avg_clutch_size}
                      onChange={e => set('avg_clutch_size', e.target.value)} min="0" placeholder="e.g. 6" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Incubation days (min)</label>
                    <input type="number" className="form-input" value={form.incubation_days_min}
                      onChange={e => set('incubation_days_min', e.target.value)} min="0" placeholder="e.g. 54" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Incubation days (max)</label>
                    <input type="number" className="form-input" value={form.incubation_days_max}
                      onChange={e => set('incubation_days_max', e.target.value)} min="0" placeholder="e.g. 60" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Notes ─────────────────────────────────────────── */}
          <div className="card section">
            <h3 style={{ marginBottom: 16 }}>Notes</h3>
            <div className="form-group">
              <textarea className="form-textarea" rows={4} value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Care notes, husbandry tips, habitat info…" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
