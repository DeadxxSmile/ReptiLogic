import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsync, useSpecies } from '../hooks/useData'
import { LoadingSpinner, SearchInput } from '../components/shared'
import { inheritanceLabel } from '../utils/format'
import './MorphLibraryPage.css'

export default function MorphLibraryPage() {
  const navigate = useNavigate()
  const { data: speciesList } = useSpecies()
  const { data: allMorphs, loading } = useAsync(() => window.api.morphs.getAll(), [])

  const [search,    setSearch]    = useState('')
  const [speciesId, setSpeciesId] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected,   setSelected]  = useState(null)

  const types = ['all', 'recessive', 'co_dominant', 'dominant', 'line_bred']

  const filtered = useMemo(() => {
    if (!allMorphs) return []
    return allMorphs.filter(m => {
      if (speciesId  !== 'all' && m.species_id       !== speciesId)  return false
      if (typeFilter !== 'all' && m.inheritance_type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return m.name.toLowerCase().includes(q) ||
               m.also_known_as?.toLowerCase().includes(q) ||
               m.gene_symbol?.toLowerCase().includes(q) ||
               m.description?.toLowerCase().includes(q)
      }
      return true
    })
  }, [allMorphs, search, speciesId, typeFilter])

  // Group by species then category
  const grouped = useMemo(() => {
    const groups = {}
    for (const m of filtered) {
      const key = `${m.species_name} — ${m.category || 'Other'}`
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  if (loading) return <LoadingSpinner label="Loading morph library…" />

  return (
    <div className="morph-library-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Morph Library</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{filtered.length} morphs</span>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/morphs/add')}>+ Add Morph</button>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', maxWidth: 600 }}>
        Reference database of all known morphs and genes. Includes inheritance type, health flags, and descriptions.
        Used automatically by the genetics calculator.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, alias, symbol…" />

        {speciesList && (
          <select className="form-select" style={{ width: 'auto' }} value={speciesId} onChange={e => setSpeciesId(e.target.value)}>
            <option value="all">All species</option>
            {speciesList.map(s => <option key={s.id} value={s.id}>{s.common_name}</option>)}
          </select>
        )}

        <div className="filter-group">
          {types.map(t => (
            <button key={t} className={`filter-btn ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All types' : inheritanceLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="morph-legend">
        {[
          { type: 'recessive',   label: 'Recessive' },
          { type: 'co_dominant', label: 'Co-dominant' },
          { type: 'dominant',    label: 'Dominant' },
          { type: 'line_bred',   label: 'Line-bred' },
        ].map(({ type, label }) => (
          <span key={type} className={`badge badge-${type}`}>{label}</span>
        ))}
        <span className="badge badge-health">⚠ Health concern</span>
      </div>

      {/* Morph groups */}
      {grouped.length === 0
        ? <div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>No morphs match your filters.</div>
        : grouped.map(([groupName, morphs]) => (
            <div key={groupName} className="morph-group">
              <div className="section-title">{groupName}</div>
              <div className="morph-grid">
                {morphs.map(m => (
                  <MorphCard
                    key={m.id}
                    morph={m}
                    selected={selected?.id === m.id}
                    onClick={() => setSelected(selected?.id === m.id ? null : m)}
                  />
                ))}
              </div>
            </div>
          ))
      }

      {/* Detail panel */}
      {selected && (
        <div className="morph-detail-overlay" onClick={() => setSelected(null)}>
          <div className="morph-detail-panel card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ marginBottom: 4 }}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${selected.inheritance_type}`}>{inheritanceLabel(selected.inheritance_type)}</span>
                  {selected.has_health_concern === 1 && <span className="badge badge-health">⚠ Health concern</span>}
                  {selected.gene_symbol && <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Gene: {selected.gene_symbol}</span>}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ fontSize: 18 }}>×</button>
            </div>

            {selected.health_concern_desc && (
              <div style={{ background: 'var(--amber-dim)', color: 'var(--amber-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 14 }}>
                ⚠ {selected.health_concern_desc}
              </div>
            )}

            {selected.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 14, lineHeight: 1.6 }}>{selected.description}</p>
            )}

            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                <MorphDetailRow label="Species"        value={selected.species_name} />
                <MorphDetailRow label="Inheritance"    value={inheritanceLabel(selected.inheritance_type)} />
                <MorphDetailRow label="Gene symbol"    value={selected.gene_symbol || '—'} />
                <MorphDetailRow label="Super form"     value={selected.super_form_name || '—'} />
                <MorphDetailRow label="Also known as"  value={selected.also_known_as || '—'} />
                <MorphDetailRow label="Discovered"     value={selected.discovered_year ? `~${selected.discovered_year}` : '—'} />
                <MorphDetailRow label="Is combination" value={selected.is_combo ? 'Yes' : 'No'} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function MorphCard({ morph, selected, onClick }) {
  return (
    <div className={`morph-card ${selected ? 'morph-card-selected' : ''} ${morph.has_health_concern ? 'morph-card-health' : ''}`} onClick={onClick}>
      <div className="morph-card-header">
        <span className="morph-card-name">{morph.name}</span>
        {morph.has_health_concern === 1 && <span title={morph.health_concern_desc} style={{ fontSize: 12, color: 'var(--amber-text)' }}>⚠</span>}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
        <span className={`badge badge-${morph.inheritance_type}`} style={{ fontSize: 10 }}>
          {inheritanceLabel(morph.inheritance_type)}
        </span>
        {morph.super_form_name && (
          <span className="badge" style={{ fontSize: 10, background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Super: {morph.super_form_name}
          </span>
        )}
      </div>
      {morph.gene_symbol && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
          [{morph.gene_symbol}]
        </div>
      )}
    </div>
  )
}

function MorphDetailRow({ label, value }) {
  return (
    <tr>
      <td style={{ color: 'var(--text-muted)', paddingBottom: 6, paddingRight: 16, whiteSpace: 'nowrap', width: '35%' }}>{label}</td>
      <td style={{ paddingBottom: 6 }}>{value}</td>
    </tr>
  )
}
