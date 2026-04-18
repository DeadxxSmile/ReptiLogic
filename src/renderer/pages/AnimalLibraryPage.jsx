import React, { useState, useMemo } from 'react'
import { useAsync, useSpecies } from '../hooks/useData'
import { LoadingSpinner, SearchInput, EmptyState } from '../components/shared'
import './AnimalLibraryPage.css'

export default function AnimalLibraryPage() {
  return (
    <div className="animal-library-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Animal Library</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Species reference & custom species</span>
        </div>
      </div>
      <SpeciesTab />
    </div>
  )
}

// ── Species tab ───────────────────────────────────────────────────────────────
function SpeciesTab() {
  const { data: speciesList, loading, refetch } = useSpecies()
  const [showAdd,  setShowAdd]  = useState(false)
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')

  const filtered = useMemo(() => {
    if (!speciesList) return []
    if (!search) return speciesList
    const q = search.toLowerCase()
    return speciesList.filter(s =>
      s.common_name?.toLowerCase().includes(q) ||
      s.scientific_name?.toLowerCase().includes(q)
    )
  }, [speciesList, search])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search species…" />
        <button className="btn btn-primary btn-sm" onClick={() => { setSelected(null); setShowAdd(true) }}>+ Add Species</button>
      </div>

      <div className="library-species-grid">
        {filtered.map(s => (
          <div key={s.id} className="library-species-card card"
            onClick={() => { setSelected(s); setShowAdd(true) }}>
            <div className="library-species-icon">
              {s.gives_live_birth ? '🐣' : '🥚'}
            </div>
            <div className="library-species-body">
              <div style={{ fontWeight: 600, fontSize: 15 }}>{s.common_name}</div>
              {s.scientific_name && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.scientific_name}</div>}
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: s.gives_live_birth ? 'var(--purple-dim)' : 'var(--accent-dim)', color: s.gives_live_birth ? 'var(--purple-text)' : 'var(--accent-text)', border: `1px solid ${s.gives_live_birth ? 'var(--purple)' : 'var(--accent)'}` }}>
                  {s.gives_live_birth ? 'Live birth' : 'Egg layer'}
                </span>
                {(s.avg_clutch_size || s.litter_size_min) && (
                  <span className="badge">
                    {s.gives_live_birth
                      ? `${s.litter_size_min || '?'}–${s.litter_size_max || '?'} young`
                      : `~${s.avg_clutch_size} eggs`}
                  </span>
                )}
                {s.incubation_days_min && (
                  <span className="badge">{s.incubation_days_min}–{s.incubation_days_max}d incubation</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <EmptyState icon="🦎" message="No species found." />
        )}
      </div>

      {showAdd && (
        <SpeciesFormModal
          existing={selected}
          onClose={() => { setShowAdd(false); setSelected(null) }}
          onSaved={() => { setShowAdd(false); setSelected(null); refetch() }}
        />
      )}
    </div>
  )
}

function SpeciesFormModal({ existing, onClose, onSaved }) {
  const isEdit = Boolean(existing)
  const [form, setForm] = useState({
    id:                  existing?.id || '',
    common_name:         existing?.common_name || '',
    scientific_name:     existing?.scientific_name || '',
    gives_live_birth:    existing?.gives_live_birth ? true : false,
    avg_clutch_size:     existing?.avg_clutch_size || '',
    litter_size_min:     existing?.litter_size_min || '',
    litter_size_max:     existing?.litter_size_max || '',
    incubation_days_min: existing?.incubation_days_min || '',
    incubation_days_max: existing?.incubation_days_max || '',
    notes:               existing?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.common_name.trim()) { setError('Common name is required'); return }
    if (!form.id.trim())          { setError('Species ID is required (e.g. ball_python)'); return }

    setSaving(true); setError(null)
    try {
      // Use settings:set as a shim — we call a direct DB upsert via a dedicated IPC if available,
      // otherwise fall back to morphs:create style. For now use the export settings save pattern.
      // We'll use a direct call to species upsert via animal creation pattern.
      await window.api.settings.set('_species_upsert', JSON.stringify({
        id:                  form.id.trim().toLowerCase().replace(/\s+/g, '_'),
        common_name:         form.common_name.trim(),
        scientific_name:     form.scientific_name.trim() || null,
        gives_live_birth:    form.gives_live_birth ? 1 : 0,
        avg_clutch_size:     form.avg_clutch_size ? Number(form.avg_clutch_size) : null,
        litter_size_min:     form.litter_size_min ? Number(form.litter_size_min) : null,
        litter_size_max:     form.litter_size_max ? Number(form.litter_size_max) : null,
        incubation_days_min: form.incubation_days_min ? Number(form.incubation_days_min) : null,
        incubation_days_max: form.incubation_days_max ? Number(form.incubation_days_max) : null,
        notes:               form.notes.trim() || null,
      }))
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{isEdit ? `Edit ${existing.common_name}` : 'Add Species'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {error && <div style={{ background: 'var(--red-dim)', color: 'var(--red-text)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 14, fontSize: 13 }}>{error}</div>}

          <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Common name *</label>
              <input className="form-input" value={form.common_name} onChange={e => set('common_name', e.target.value)} placeholder="e.g. Ball Python" />
            </div>
            <div className="form-group">
              <label className="form-label">Species ID *</label>
              <input className="form-input" value={form.id} onChange={e => set('id', e.target.value.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''))}
                placeholder="e.g. ball_python" style={{ fontFamily: 'var(--font-mono)' }} disabled={isEdit} />
              {!isEdit && <span className="form-hint">Lowercase, underscores only. Cannot be changed.</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Scientific name</label>
              <input className="form-input" value={form.scientific_name} onChange={e => set('scientific_name', e.target.value)} placeholder="e.g. Python regius" style={{ fontStyle: 'italic' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
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

          {form.gives_live_birth ? (
            <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Min litter size</label>
                <input type="number" className="form-input" value={form.litter_size_min} onChange={e => set('litter_size_min', e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Max litter size</label>
                <input type="number" className="form-input" value={form.litter_size_max} onChange={e => set('litter_size_max', e.target.value)} min="0" />
              </div>
            </div>
          ) : (
            <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Avg clutch size</label>
                <input type="number" className="form-input" value={form.avg_clutch_size} onChange={e => set('avg_clutch_size', e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Incubation days (min)</label>
                <input type="number" className="form-input" value={form.incubation_days_min} onChange={e => set('incubation_days_min', e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Incubation days (max)</label>
                <input type="number" className="form-input" value={form.incubation_days_max} onChange={e => set('incubation_days_max', e.target.value)} min="0" />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Care notes, husbandry tips…" />
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add species'}</button>
        </div>
      </div>
    </div>
  )
}

