import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpecies } from '../hooks/useData'
import { LoadingSpinner, SearchInput, EmptyState } from '../components/shared'
import './AnimalLibraryPage.css'

export default function AnimalLibraryPage() {
  const navigate = useNavigate()
  const { data: speciesList, loading } = useSpecies()
  const [search, setSearch] = useState('')

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
    <div className="animal-library-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Animal Library</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Species reference & custom species</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/library/add')}>
          + Add Species
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search species…" />
      </div>

      <div className="library-species-grid">
        {filtered.map(s => (
          <div
            key={s.id}
            className="library-species-card card"
            onClick={() => navigate(`/library/add?edit=${s.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="library-species-icon">
              {s.gives_live_birth ? '🐣' : '🥚'}
            </div>
            <div className="library-species-body">
              <div style={{ fontWeight: 600, fontSize: 15 }}>{s.common_name}</div>
              {s.scientific_name && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {s.scientific_name}
                </div>
              )}
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge" style={{
                  background: s.gives_live_birth ? 'var(--purple-dim)' : 'var(--accent-dim)',
                  color:      s.gives_live_birth ? 'var(--purple-text)' : 'var(--accent-text)',
                  border:     `1px solid ${s.gives_live_birth ? 'var(--purple)' : 'var(--accent)'}`,
                }}>
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
    </div>
  )
}
