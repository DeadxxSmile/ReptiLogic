import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnimals } from '../hooks/useData'
import {
  AnimalPhoto, MorphTagList, SexBadge, StatusBadge,
  EmptyState, LoadingSpinner, PageError, SearchInput, StatTile
} from '../components/shared'
import { ageString, formatDate, formatWeight } from '../utils/format'
import './CollectionsPage.css'

const SEX_FILTERS    = ['all', 'male', 'female']
const STATUS_FILTERS = ['active', 'all', 'sold', 'deceased']

export default function CollectionsPage() {
  const { data: animals, loading, error, refetch } = useAnimals()
  const navigate = useNavigate()

  const [search,        setSearch]        = useState('')
  const [sexFilter,     setSexFilter]     = useState('all')
  const [statusFilter,  setStatusFilter]  = useState('active')
  const [speciesFilter, setSpeciesFilter] = useState('all')
  const [viewMode,      setViewMode]      = useState('grid') // 'grid' | 'list'

  const speciesList = useMemo(() => {
    if (!animals) return []
    const map = {}
    for (const a of animals) {
      if (!map[a.species_id]) map[a.species_id] = a.species_name
    }
    return Object.entries(map).map(([id, name]) => ({ id, name }))
  }, [animals])

  const filtered = useMemo(() => {
    if (!animals) return []
    return animals.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (sexFilter    !== 'all' && a.sex    !== sexFilter)    return false
      if (speciesFilter !== 'all' && a.species_id !== speciesFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const inName    = a.name?.toLowerCase().includes(q)
        const inMorphs  = a.morphs?.some(m => m.morph_name?.toLowerCase().includes(q))
        const inNotes   = a.notes?.toLowerCase().includes(q)
        const inSpecies = a.species_name?.toLowerCase().includes(q)
        if (!inName && !inMorphs && !inNotes && !inSpecies) return false
      }
      return true
    })
  }, [animals, search, sexFilter, statusFilter, speciesFilter])

  // Stats
  const stats = useMemo(() => {
    const active = (animals || []).filter(a => a.status === 'active')
    return {
      total:   active.length,
      males:   active.filter(a => a.sex === 'male').length,
      females: active.filter(a => a.sex === 'female').length,
      species: new Set(active.map(a => a.species_id)).size,
    }
  }, [animals])

  if (loading) return <LoadingSpinner label="Loading collection…" />
  if (error)   return <PageError message={error} />

  return (
    <div className="collections-page">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Collection</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {filtered.length} animal{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/collection/add')}>
          + Add Animal
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      {animals?.length > 0 && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <StatTile label="Active animals" value={stats.total} />
          <StatTile label="Males"   value={stats.males}   color="var(--blue-text)" />
          <StatTile label="Females" value={stats.females} color="var(--purple-text)" />
          <StatTile label="Species" value={stats.species} />
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="collections-filters">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, morph, species…" />

        <div className="filter-group">
          {SEX_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn ${sexFilter === f ? 'active' : ''}`}
              onClick={() => setSexFilter(f)}
            >
              {f === 'all' ? 'All sexes' : f === 'male' ? '♂ Male' : '♀ Female'}
            </button>
          ))}
        </div>

        <div className="filter-group">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f === 'all' ? 'All status' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {speciesList.length > 1 && (
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={speciesFilter}
            onChange={e => setSpeciesFilter(e.target.value)}
          >
            <option value="all">All species</option>
            {speciesList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            className={`btn btn-ghost btn-sm ${viewMode === 'grid' ? 'active-view' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >⊞</button>
          <button
            className={`btn btn-ghost btn-sm ${viewMode === 'list' ? 'active-view' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >☰</button>
        </div>
      </div>

      {/* ── Animals ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        animals?.length === 0
          ? <EmptyState
              icon="🐍"
              title="No animals yet"
              message="Add your first animal to start tracking your collection."
              action={<button className="btn btn-primary" onClick={() => navigate('/collection/add')}>+ Add Animal</button>}
            />
          : <EmptyState icon="🔍" title="No results" message="Try adjusting your filters or search term." />
      ) : viewMode === 'grid' ? (
        <div className="animal-grid">
          {filtered.map(animal => (
            <AnimalCard key={animal.id} animal={animal} onClick={() => navigate(`/collection/${animal.id}`)} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Name</th>
                <th>Species</th>
                <th>Sex</th>
                <th>Age</th>
                <th>Weight</th>
                <th>Morphs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(animal => (
                <AnimalRow key={animal.id} animal={animal} onClick={() => navigate(`/collection/${animal.id}`)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Animal card (grid view) ───────────────────────────────────────────────────
function AnimalCard({ animal, onClick }) {
  return (
    <div className="animal-card" onClick={onClick}>
      <div className="animal-card-photo">
        <AnimalPhoto
          filename={animal.primary_photo_filename}
          name={animal.name}
          size={80}
          style={{ borderRadius: 'var(--radius-md)' }}
        />
        {animal.status !== 'active' && (
          <div className="animal-card-status-overlay">
            <StatusBadge status={animal.status} />
          </div>
        )}
      </div>

      <div className="animal-card-body">
        <div className="animal-card-header">
          <span className="animal-card-name">{animal.name}</span>
          <span className={`sex-dot sex-${animal.sex}`} title={animal.sex}>
            {animal.sex === 'male' ? '♂' : animal.sex === 'female' ? '♀' : '?'}
          </span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          {animal.species_name}
          {animal.dob && <span> · {ageString(animal.dob)}</span>}
        </div>

        <MorphTagList morphs={animal.morphs || []} max={4} />
      </div>
    </div>
  )
}

// ── Animal row (list view) ────────────────────────────────────────────────────
function AnimalRow({ animal, onClick }) {
  return (
    <tr onClick={onClick} style={{ cursor: 'pointer' }}>
      <td>
        <AnimalPhoto filename={animal.primary_photo_filename} name={animal.name} size={36} />
      </td>
      <td><strong>{animal.name}</strong></td>
      <td style={{ color: 'var(--text-secondary)' }}>{animal.species_name}</td>
      <td>
        <span style={{ color: animal.sex === 'male' ? 'var(--blue-text)' : animal.sex === 'female' ? 'var(--purple-text)' : 'var(--text-muted)' }}>
          {animal.sex === 'male' ? '♂' : animal.sex === 'female' ? '♀' : '?'}
        </span>
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>{ageString(animal.dob)}</td>
      <td style={{ color: 'var(--text-secondary)' }}>{formatWeight(animal.weight_grams)}</td>
      <td><MorphTagList morphs={animal.morphs || []} max={3} /></td>
      <td><StatusBadge status={animal.status} /></td>
    </tr>
  )
}
