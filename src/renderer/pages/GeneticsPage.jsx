import React, { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAnimals, useMorphs, useSpecies } from '../hooks/useData'
import { MorphTag, LoadingSpinner, StatTile } from '../components/shared'
import { inheritanceLabel, pct } from '../utils/format'
import './GeneticsPage.css'

// ── Genetics Calculator Page ──────────────────────────────────────────────────
export default function GeneticsPage() {
  const { data: animals }     = useAnimals()
  const { data: speciesList } = useSpecies()

  // Support ?male=id&female=id deep-links from Suggested Pairings
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const initMale = searchParams.get('male')   || ''
  const initFem  = searchParams.get('female') || ''

  const [speciesId, setSpeciesId] = useState('ball_python')
  const { data: morphList } = useMorphs(speciesId)

  const [mode, setMode] = useState(initMale && initFem ? 'from_collection' : 'manual')

  const [maleGenes,   setMaleGenes]   = useState([])
  const [femaleGenes, setFemaleGenes] = useState([])
  const [maleId,      setMaleId]      = useState(initMale)
  const [femaleId,    setFemaleId]    = useState(initFem)

  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)

  const males   = (animals || []).filter(a => a.sex === 'male'   && a.status === 'active' && a.species_id === speciesId)
  const females = (animals || []).filter(a => a.sex === 'female' && a.status === 'active' && a.species_id === speciesId)

  const calculate = async () => {
    setLoading(true)
    setResult(null)
    try {
      let res
      if (mode === 'from_collection' && maleId && femaleId) {
        res = await window.api.breeding.calculateOutcomes(maleId, femaleId)
      } else {
        res = await window.api.genetics.calculate(maleGenes, femaleGenes)
      }
      setResult(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Auto-calc if arriving from a deep-link
  useEffect(() => {
    if (initMale && initFem && animals?.length) {
      calculate()
    }
  }, [animals?.length]) // eslint-disable-line

  const canCalculate = mode === 'from_collection'
    ? maleId && femaleId
    : true  // manual mode always possible (empty = normal × normal)

  return (
    <div className="genetics-page">
      <div className="page-header">
        <h1>🧬 Genetics Calculator</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: 600 }}>
        Calculate offspring probabilities from a pairing. Handles recessive, co-dominant, dominant, and line-bred genes across all combinations.
      </p>

      {/* Species picker */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: '1.25rem' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>Species:</label>
        <select className="form-select" style={{ width: 'auto' }} value={speciesId} onChange={e => { setSpeciesId(e.target.value); setMaleGenes([]); setFemaleGenes([]) }}>
          {(speciesList || []).map(s => <option key={s.id} value={s.id}>{s.common_name}</option>)}
        </select>

        <div className="filter-group">
          <button className={`filter-btn ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>Manual entry</button>
          <button className={`filter-btn ${mode === 'from_collection' ? 'active' : ''}`} onClick={() => setMode('from_collection')}>From collection</button>
        </div>
      </div>

      {/* Parent inputs */}
      <div className="calc-parents">

        {mode === 'from_collection' ? (
          <>
            <ParentFromCollection
              label="Male ♂" sex="male"
              animals={males}
              selectedId={maleId}
              onSelect={setMaleId}
            />
            <div className="calc-cross">×</div>
            <ParentFromCollection
              label="Female ♀" sex="female"
              animals={females}
              selectedId={femaleId}
              onSelect={setFemaleId}
            />
          </>
        ) : (
          <>
            <ParentGeneBuilder
              label="Male ♂"
              genes={maleGenes}
              morphList={morphList || []}
              onChange={setMaleGenes}
              color="var(--blue-text)"
            />
            <div className="calc-cross">×</div>
            <ParentGeneBuilder
              label="Female ♀"
              genes={femaleGenes}
              morphList={morphList || []}
              onChange={setFemaleGenes}
              color="var(--purple-text)"
            />
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={calculate}
          disabled={loading || !canCalculate}
          style={{ minWidth: 180 }}
        >
          {loading ? 'Calculating…' : '🧬 Calculate offspring'}
        </button>
      </div>

      {/* Results */}
      {result && <CalcResults result={result} />}
    </div>
  )
}

// ── Parent from collection ────────────────────────────────────────────────────
function ParentFromCollection({ label, animals, selectedId, onSelect, sex }) {
  const selected = animals.find(a => a.id === selectedId)
  const color    = sex === 'male' ? 'var(--blue-text)' : 'var(--purple-text)'

  return (
    <div className="calc-parent-card">
      <h3 style={{ color, marginBottom: 12 }}>{label}</h3>
      <select className="form-select" value={selectedId} onChange={e => onSelect(e.target.value)}>
        <option value="">Select {sex}…</option>
        {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      {selected && (
        <div style={{ marginTop: 10 }}>
          <div className="tag-list">
            {selected.morphs?.map((m, i) => <MorphTag key={i} morph={m} />)}
          </div>
          {!selected.morphs?.length && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No morphs recorded.</p>}
        </div>
      )}
    </div>
  )
}

// ── Manual gene builder ───────────────────────────────────────────────────────
function ParentGeneBuilder({ label, genes, morphList, onChange, color }) {
  const [search, setSearch] = useState('')

  const filtered = morphList.filter(m => {
    const notAdded = !genes.find(g => g.morphId === m.id)
    const inSearch = !search || m.name.toLowerCase().includes(search.toLowerCase())
    return notAdded && inSearch
  })

  const addGene = (morph) => {
    const defaultExpr = morph.inheritance_type === 'recessive' ? 'visual' : 'single'
    onChange(prev => [...prev, {
      morphId:         morph.id,
      morphName:       morph.name,
      inheritanceType: morph.inheritance_type,
      superFormName:   morph.super_form_name,
      hasHealthConcern: morph.has_health_concern,
      healthConcernDesc: morph.health_concern_desc,
      expression:      defaultExpr,
    }])
    setSearch('')
  }

  const removeGene = (morphId) => onChange(prev => prev.filter(g => g.morphId !== morphId))

  const updateExpr = (morphId, expression) =>
    onChange(prev => prev.map(g => g.morphId === morphId ? { ...g, expression } : g))

  return (
    <div className="calc-parent-card">
      <h3 style={{ color, marginBottom: 12 }}>{label}</h3>

      {/* Added genes */}
      {genes.length > 0 && (
        <div className="calc-gene-list">
          {genes.map(g => (
            <div key={g.morphId} className="calc-gene-row">
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{g.morphName}</span>
              <select
                className="form-select"
                style={{ fontSize: 11, padding: '3px 6px', height: 'auto', width: 'auto' }}
                value={g.expression}
                onChange={e => updateExpr(g.morphId, e.target.value)}
              >
                {g.inheritanceType === 'recessive' ? (
                  <>
                    <option value="visual">Visual</option>
                    <option value="proven_het">Proven Het</option>
                    <option value="het">Het</option>
                    <option value="possible_het">Possible Het</option>
                  </>
                ) : (
                  <>
                    <option value="single">Single copy</option>
                    <option value="super">{g.superFormName || 'Super'}</option>
                    <option value="normal">Normal / non-visual</option>
                  </>
                )}
              </select>
              <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', color: 'var(--text-muted)' }} onClick={() => removeGene(g.morphId)}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Gene search */}
      <div style={{ marginTop: genes.length ? 10 : 0 }}>
        <input
          className="form-input"
          placeholder="Add gene…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 6 }}
        />
        {search && (
          <div className="calc-gene-dropdown">
            {filtered.slice(0, 20).map(m => (
              <button key={m.id} className="morph-list-item" onClick={() => addGene(m)}>
                <span style={{ flex: 1, fontSize: 12 }}>{m.name}</span>
                <span className={`badge badge-${m.inheritance_type}`} style={{ fontSize: 10 }}>{inheritanceLabel(m.inheritance_type)}</span>
              </button>
            ))}
            {filtered.length === 0 && <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>No results</div>}
          </div>
        )}
      </div>

      {genes.length === 0 && !search && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Normal (no morphs) — search above to add genes</p>
      )}
    </div>
  )
}

// ── Calculator results ────────────────────────────────────────────────────────
function CalcResults({ result }) {
  const { outcomes = [], healthWarnings = [], summary = {} } = result
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? outcomes : outcomes.slice(0, 12)

  return (
    <div className="calc-results">
      <h3 style={{ marginBottom: 12 }}>Possible offspring</h3>

      {healthWarnings?.length > 0 && (
        <div style={{ background: 'var(--amber-dim)', color: 'var(--amber-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 14, border: '1px solid rgba(230,168,23,0.3)' }}>
          ⚠ <strong>Health concern:</strong> {healthWarnings.map(w => `${w.morphName} — ${w.description}`).join(' · ')}
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <StatTile label="Unique outcomes" value={summary.totalOutcomes || 0} />
        <StatTile label="With morph"      value={`${summary.morphPercent?.toFixed(0) || 0}%`} color="var(--accent-text)" />
        <StatTile label="Normal"          value={`${summary.normalPercent?.toFixed(0) || 0}%`} />
        <StatTile label="Visual combos"   value={summary.uniqueVisuals || 0} color="var(--blue-text)" />
      </div>

      <div className="calc-result-grid">
        {visible.map((o, i) => (
          <OutcomeCard key={i} outcome={o} />
        ))}
      </div>

      {outcomes.length > 12 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => setShowAll(v => !v)}>
            {showAll ? 'Show fewer' : `Show all ${outcomes.length} outcomes`}
          </button>
        </div>
      )}
    </div>
  )
}

function OutcomeCard({ outcome: o }) {
  const pctVal = (o.probability * 100)
  const pctStr = pctVal < 0.1 ? '<0.1%' : pctVal === Math.round(pctVal) ? `${pctVal}%` : `${pctVal.toFixed(1)}%`

  return (
    <div className={`outcome-card ${o.hasHealthConcern ? 'outcome-card-health' : ''}`}>
      <div className="outcome-card-pct">{pctStr}</div>
      <div className="outcome-card-label">{o.label}</div>
      {o.hasHealthConcern && (
        <div className="outcome-card-warning">⚠ Health concern</div>
      )}
    </div>
  )
}
