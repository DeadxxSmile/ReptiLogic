import React, { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBreeding, useAnimals, useAsync } from '../hooks/useData'
import {
  AnimalPhoto, BreedingStatusBadge, EmptyState,
  LoadingSpinner, PageError, SearchInput, StatTile
} from '../components/shared'
import { formatDate, timeAgo, pluralise } from '../utils/format'
import './BreedingPage.css'

export default function BreedingPage() {
  const { data: records, loading, error, refetch } = useBreeding()
  const { data: animals } = useAnimals()
  const navigate = useNavigate()

  const [tab,          setTab]          = useState('Records')
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNewForm,  setShowNewForm]  = useState(false)

  const statusOptions = ['all', 'planned', 'active', 'gravid', 'laid', 'hatched', 'failed']

  const filtered = useMemo(() => {
    if (!records) return []
    return records.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.male_name?.toLowerCase().includes(q) && !r.female_name?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [records, search, statusFilter])

  // gives_live_birth is joined directly on each record from the DB
  const hasLiveBirth = useMemo(() => {
    if (!filtered) return false
    return filtered.some(r => r.gives_live_birth)
  }, [filtered])

  // Return context-aware label for a status value
  const statusLabel = (s) => {
    if (s === 'all')     return 'All'
    if (s === 'laid')    return hasLiveBirth ? 'Laid / Born' : 'Laid'
    if (s === 'hatched') return hasLiveBirth ? 'Hatched / Born' : 'Hatched'
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  const stats = useMemo(() => {
    if (!records) return {}
    const active  = records.filter(r => r.status === 'active').length
    const gravid  = records.filter(r => r.status === 'gravid').length
    const eggs    = records.reduce((s, r) => s + (r.total_eggs || 0), 0)
    const hatched = records.reduce((s, r) => s + (r.hatched_count || 0), 0)
    return { active, gravid, eggs, hatched }
  }, [records])

  if (loading) return <LoadingSpinner label="Loading breeding records…" />
  if (error)   return <PageError message={error} />

  return (
    <div className="breeding-page">

      <div className="page-header">
        <div className="page-header-left">
          <h1>Breeding</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>+ New Pairing</button>
      </div>

      {records?.length > 0 && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <StatTile label="Active pairings"  value={stats.active}  color="var(--blue-text)" />
          <StatTile label="Gravid females"   value={stats.gravid}  color="var(--purple-text)" />
          <StatTile label={hasLiveBirth ? 'Total eggs / young' : 'Total eggs'} value={stats.eggs} />
          <StatTile label={hasLiveBirth ? 'Hatched / Born'     : 'Hatched'}    value={stats.hatched} color="var(--accent-text)" />
        </div>
      )}

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: '1.25rem' }}>
        {['Records', 'Suggested pairings'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Suggested pairings' ? (
        <SuggestedPairingsTab animals={animals || []} onNavigate={navigate} />
      ) : (<>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by animal name…" />
        <div className="filter-group">
          {statusOptions.map(s => (
            <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {showNewForm && (
        <NewPairingForm
          animals={animals || []}
          onClose={() => setShowNewForm(false)}
          onSaved={(id) => { setShowNewForm(false); refetch(); navigate(`/breeding/${id}`) }}
        />
      )}

      {filtered.length === 0
        ? <EmptyState
            icon="🥚"
            title={records?.length === 0 ? 'No breeding records' : 'No results'}
            message={records?.length === 0 ? 'Start tracking pairings by adding a new pairing record.' : 'Try adjusting your filters.'}
            action={records?.length === 0 && <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>+ New Pairing</button>}
          />
        : <div className="breeding-list">
            {filtered.map(r => (
              <BreedingCard key={r.id} record={r} onClick={() => navigate(`/breeding/${r.id}`)} />
            ))}
          </div>
      }
      </>)}
    </div>
  )
}

// ── Breeding card ─────────────────────────────────────────────────────────────
function BreedingCard({ record: r, onClick }) {
  const latestClutch = r.clutches?.[r.clutches.length - 1]

  return (
    <div className="breeding-card" onClick={onClick}>
      <div className="breeding-card-animals">
        <AnimalPhoto filename={r.male_photo}   name={r.male_name}   size={44} />
        <div className="breeding-card-couple">
          <span className="breeding-couple-name">
            <span style={{ color: 'var(--blue-text)' }}>♂</span> {r.male_name}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>×</span>
          <span className="breeding-couple-name">
            <span style={{ color: 'var(--purple-text)' }}>♀</span> {r.female_name}
          </span>
        </div>
        <AnimalPhoto filename={r.female_photo} name={r.female_name} size={44} />
      </div>

      <div className="breeding-card-meta">
        <BreedingStatusBadge status={r.status} />

        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, flexWrap: 'wrap' }}>
          {r.first_pairing_date && (
            <span>First paired: {formatDate(r.first_pairing_date)}</span>
          )}
          {r.total_eggs > 0 && (
            <span>🥚 {pluralise(r.total_eggs, 'egg')}{r.slug_count > 0 ? `, ${r.slug_count} slug${r.slug_count !== 1 ? 's' : ''}` : ''}</span>
          )}
          {r.hatched_count > 0 && (
            <span style={{ color: 'var(--accent-text)' }}>🐍 {r.hatched_count} hatched</span>
          )}
        </div>

        {latestClutch?.hatch_date && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Hatched {formatDate(latestClutch.hatch_date)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── New pairing form ──────────────────────────────────────────────────────────
function NewPairingForm({ animals, onClose, onSaved }) {
  const [form,   setForm]   = useState({ male_id: '', female_id: '', first_pairing_date: new Date().toISOString().slice(0,10), notes: '' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const males   = animals.filter(a => a.sex === 'male'   && a.status === 'active')
  const females = animals.filter(a => a.sex === 'female' && a.status === 'active')

  const handleSave = async () => {
    if (!form.male_id || !form.female_id) { setError('Select both male and female'); return }
    setSaving(true)
    try {
      const record = await window.api.breeding.create(form)
      onSaved(record.id)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="new-pairing-overlay" onClick={onClose}>
      <div className="new-pairing-form card" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>New pairing</h3>

        {error && <div style={{ color: 'var(--red-text)', marginBottom: 10, fontSize: 13 }}>{error}</div>}

        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Male ♂</label>
            <select className="form-select" value={form.male_id} onChange={e => setForm(f => ({ ...f, male_id: e.target.value }))}>
              <option value="">Select male…</option>
              {males.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species_name})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Female ♀</label>
            <select className="form-select" value={form.female_id} onChange={e => setForm(f => ({ ...f, female_id: e.target.value }))}>
              <option value="">Select female…</option>
              {females.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species_name})</option>)}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">First pairing date</label>
          <input type="date" className="form-input" value={form.first_pairing_date} onChange={e => setForm(f => ({ ...f, first_pairing_date: e.target.value }))} />
        </div>

        <div className="form-group" style={{ marginTop: 10 }}>
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating…' : 'Create pairing'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Suggested Pairings Tab ────────────────────────────────────────────────────
function SuggestedPairingsTab({ animals, onNavigate }) {
  const [speciesId, setSpeciesId] = useState('ball_python')
  const { data: suggestions, loading } = useAsync(
    () => window.api.breeding.getSuggestedPairs(speciesId),
    [speciesId]
  )

  const speciesList = [...new Map(animals.map(a => [a.species_id, a.species_name])).entries()]

  if (loading) return <LoadingSpinner label="Analysing collection…" />

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, flex: 1 }}>
          Suggested pairings based on complementary genetics in your active collection.
        </p>
        {speciesList.length > 1 && (
          <select className="form-select" style={{ width: 'auto' }} value={speciesId} onChange={e => setSpeciesId(e.target.value)}>
            {speciesList.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
      </div>

      {!suggestions?.length ? (
        <EmptyState
          icon="🔬"
          title="No suggestions"
          message="Add more animals with morph data to see suggested pairings."
        />
      ) : (
        <div className="breeding-list">
          {suggestions.map((s, i) => (
            <SuggestedPairingCard key={i} suggestion={s} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

function SuggestedPairingCard({ suggestion: s, onNavigate }) {
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const record = await window.api.breeding.create({
        male_id:   s.male.id,
        female_id: s.female.id,
        status:    'planned',
      })
      onNavigate(`/breeding/${record.id}`)
    } catch (e) {
      console.error(e)
      setCreating(false)
    }
  }

  return (
    <div className="breeding-card" style={{ cursor: 'default' }}>
      <div className="breeding-card-animals">
        <AnimalPhoto filename={s.male.primary_photo_filename}   name={s.male.name}   size={44} />
        <div className="breeding-card-couple">
          <span className="breeding-couple-name">
            <span style={{ color: 'var(--blue-text)' }}>♂</span> {s.male.name}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>×</span>
          <span className="breeding-couple-name">
            <span style={{ color: 'var(--purple-text)' }}>♀</span> {s.female.name}
          </span>
        </div>
        <AnimalPhoto filename={s.female.primary_photo_filename} name={s.female.name} size={44} />
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-text)' }}>
            Score: {s.score}
          </span>
        </div>
        <ul style={{ paddingLeft: 16, margin: 0 }}>
          {s.reasons.map((r, i) => (
            <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>{r}</li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'Creating…' : '+ Create pairing record'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate(`/genetics?male=${s.male.id}&female=${s.female.id}`)}
          >
            🧬 Preview genetics
          </button>
        </div>
      </div>
    </div>
  )
}
