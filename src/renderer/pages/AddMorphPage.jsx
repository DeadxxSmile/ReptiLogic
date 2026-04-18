import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpecies } from '../hooks/useData'
import { LoadingSpinner } from '../components/shared'
import './AddAnimalPage.css'

const INHERITANCE_OPTIONS = [
  ['recessive', 'Recessive'],
  ['co_dominant', 'Co-dominant'],
  ['dominant', 'Dominant'],
  ['line_bred', 'Line-bred'],
  ['polygenetic', 'Polygenetic'],
]

const CATEGORY_OPTIONS = ['Recessive', 'Co-dominant', 'Dominant', 'Line-bred', 'Polygenetic', 'Combo', 'Other']

export default function AddMorphPage() {
  const navigate = useNavigate()
  const { data: speciesList, loading: speciesLoading } = useSpecies()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    species_id: 'ball_python',
    name: '',
    gene_symbol: '',
    category: 'Recessive',
    inheritance_type: 'recessive',
    super_form_name: '',
    allele_group_id: '',
    cross_allele_result: '',
    has_health_concern: false,
    health_concern_desc: '',
    description: '',
    also_known_as: '',
    discovered_year: '',
    is_combo: false,
    combo_components: '',
    sort_order: '999',
  })

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Morph name is required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await window.api.morphs.create({
        ...form,
        discovered_year: form.discovered_year || null,
        sort_order: form.sort_order || 999,
      })
      navigate('/morphs')
    } catch (e) {
      setError(e.message || 'Could not save morph.')
    } finally {
      setSaving(false)
    }
  }

  if (speciesLoading) return <LoadingSpinner label="Loading species..." />

  return (
    <div className="add-animal-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <h1>Add Custom Morph</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Morph'}
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
          <div className="card section">
            <h3 style={{ marginBottom: 16 }}>Morph details</h3>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sunset, Axanthic Project X" />
              </div>

              <div className="form-group">
                <label className="form-label">Species *</label>
                <select className="form-select" value={form.species_id} onChange={e => set('species_id', e.target.value)}>
                  {(speciesList || []).map(s => (
                    <option key={s.id} value={s.id}>{s.common_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Inheritance type *</label>
                <select className="form-select" value={form.inheritance_type} onChange={e => set('inheritance_type', e.target.value)}>
                  {INHERITANCE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Gene symbol</label>
                <input className="form-input" value={form.gene_symbol} onChange={e => set('gene_symbol', e.target.value)} placeholder="e.g. pst" />
              </div>

              <div className="form-group">
                <label className="form-label">Super form name</label>
                <input className="form-input" value={form.super_form_name} onChange={e => set('super_form_name', e.target.value)} placeholder="Optional for co-dominant genes" />
              </div>

              <div className="form-group">
                <label className="form-label">Discovered year</label>
                <input type="number" className="form-input" value={form.discovered_year} onChange={e => set('discovered_year', e.target.value)} placeholder="e.g. 2017" />
              </div>

              <div className="form-group">
                <label className="form-label">Sort order</label>
                <input type="number" className="form-input" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} placeholder="999" />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Also known as</label>
                <input className="form-input" value={form.also_known_as} onChange={e => set('also_known_as', e.target.value)} placeholder="Comma-separated aliases" />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows="4" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the morph, project notes, lineage, etc." />
              </div>

              {/* ── Allele group (complex) ─────────────────────── */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Allele group / complex</label>
                <span className="form-hint" style={{ display: 'block', marginBottom: 6 }}>
                  If this morph shares a chromosomal locus with other morphs (like the BEL complex), enter the group ID here (e.g. <code>bp_bel_complex</code>). Leave blank if independent.
                </span>
                <div className="grid-2" style={{ gap: 12 }}>
                  <input className="form-input" value={form.allele_group_id} onChange={e => set('allele_group_id', e.target.value)}
                    placeholder="e.g. bp_bel_complex" style={{ fontFamily: 'var(--font-mono)' }} />
                  <input className="form-input" value={form.cross_allele_result} onChange={e => set('cross_allele_result', e.target.value)}
                    placeholder="Result when paired with another group member (e.g. Blue Eyed Leucistic)" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Health concern</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.has_health_concern} onChange={e => set('has_health_concern', e.target.checked)} />
                  This morph has a known health concern
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Combination morph</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.is_combo} onChange={e => set('is_combo', e.target.checked)} />
                  This is a combo / project morph
                </label>
              </div>

              {form.has_health_concern && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Health concern details</label>
                  <textarea className="form-textarea" rows="3" value={form.health_concern_desc} onChange={e => set('health_concern_desc', e.target.value)} placeholder="Describe the issue or caution for this morph" />
                </div>
              )}

              {form.is_combo && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Combo components</label>
                  <input className="form-input" value={form.combo_components} onChange={e => set('combo_components', e.target.value)} placeholder='e.g. Pastel + Spider' />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
