import React, { useState } from 'react'
import { useAsync } from '../hooks/useData'
import { EmptyState, LoadingSpinner } from './shared'
import { formatDate } from '../utils/format'

/**
 * Expandable offspring tracker panel, shown below a ClutchCard.
 * Lets user log individual babies — sex, weight, disposition, sale info.
 */
export default function OffspringPanel({ clutch, breedingId }) {
  const [expanded, setExpanded] = useState(false)
  const { data: offspring, loading, refetch } = useAsync(
    () => expanded ? window.api.offspring.getByClutch(clutch.id) : Promise.resolve(null),
    [expanded, clutch.id]
  )

  const [showAdd, setShowAdd]   = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [editId,  setEditId]    = useState(null)

  const emptyForm = {
    sex: 'unknown', hatch_date: clutch.hatch_date?.slice(0,10) || '',
    hatch_weight_grams: '', disposition: 'unknown',
    sale_price: '', buyer_name: '', sale_date: '', notes: ''
  }
  const [form, setForm] = useState(emptyForm)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async () => {
    setSaving(true)
    try {
      await window.api.offspring.add(clutch.id, form)
      setForm(emptyForm)
      setShowAdd(false)
      refetch()
    } finally { setSaving(false) }
  }

  const handleUpdate = async (id) => {
    setSaving(true)
    try {
      await window.api.offspring.update(id, form)
      setEditId(null)
      refetch()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await window.api.offspring.delete(id)
      refetch()
    } catch (e) {
      console.error('Failed to delete offspring:', e)
    }
  }

  const startEdit = (o) => {
    setForm({
      sex: o.sex, hatch_date: o.hatch_date?.slice(0,10) || '',
      hatch_weight_grams: o.hatch_weight_grams || '',
      disposition: o.disposition,
      sale_price: o.sale_price || '', buyer_name: o.buyer_name || '',
      sale_date: o.sale_date?.slice(0,10) || '', notes: o.notes || ''
    })
    setEditId(o.id)
    setShowAdd(false)
  }

  const dispositionColor = (d) => ({
    kept:    'var(--accent-text)',
    sold:    'var(--blue-text)',
    traded:  'var(--amber-text)',
    died:    'var(--red-text)',
    unknown: 'var(--text-muted)',
  }[d] || 'var(--text-muted)')

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setExpanded(v => !v)}
        style={{ fontSize: 12, color: 'var(--text-secondary)' }}
      >
        {expanded ? '▾' : '▸'} Offspring tracker
        {clutch.hatched_count > 0 && (
          <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>
            ({clutch.hatched_count} {clutch.hatched_count === 1 ? 'baby' : 'babies'})
          </span>
        )}
      </button>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          {loading && <LoadingSpinner label="Loading offspring…" />}

          {!loading && offspring && (
            <>
              {/* Summary row */}
              {offspring.length > 0 && (
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, flexWrap: 'wrap' }}>
                  {['kept','sold','traded','died','unknown'].map(d => {
                    const count = offspring.filter(o => o.disposition === d).length
                    if (!count) return null
                    return <span key={d} style={{ color: dispositionColor(d) }}>{count} {d}</span>
                  })}
                  <span>{offspring.filter(o => o.sex === 'male').length}♂ / {offspring.filter(o => o.sex === 'female').length}♀</span>
                  {offspring.some(o => o.sale_price > 0) && (
                    <span style={{ color: 'var(--accent-text)' }}>
                      ${offspring.reduce((s, o) => s + (Number(o.sale_price) || 0), 0).toFixed(0)} total sales
                    </span>
                  )}
                </div>
              )}

              {/* Offspring rows */}
              {offspring.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 10 }}>
                  <table style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>#</th><th>Sex</th><th>Hatch wt</th>
                        <th>Disposition</th><th>Sale $</th><th>Buyer</th><th>Notes</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {offspring.map((o, i) => (
                        editId === o.id ? (
                          <tr key={o.id} style={{ background: 'var(--bg-elevated)' }}>
                            <td style={{ color: 'var(--text-muted)' }}>{i+1}</td>
                            <td>
                              <select className="form-select" style={{ fontSize: 11, padding: '2px 4px', height: 'auto' }}
                                value={form.sex} onChange={e => set('sex', e.target.value)}>
                                <option value="male">♂</option>
                                <option value="female">♀</option>
                                <option value="unknown">?</option>
                              </select>
                            </td>
                            <td>
                              <input type="number" style={{ width: 60, fontSize: 11 }} className="form-input"
                                value={form.hatch_weight_grams} onChange={e => set('hatch_weight_grams', e.target.value)} placeholder="g" />
                            </td>
                            <td>
                              <select className="form-select" style={{ fontSize: 11, padding: '2px 4px', height: 'auto' }}
                                value={form.disposition} onChange={e => set('disposition', e.target.value)}>
                                {['kept','sold','traded','died','unknown'].map(d =>
                                  <option key={d} value={d}>{d}</option>
                                )}
                              </select>
                            </td>
                            <td>
                              <input type="number" style={{ width: 60, fontSize: 11 }} className="form-input"
                                value={form.sale_price} onChange={e => set('sale_price', e.target.value)} placeholder="$" />
                            </td>
                            <td>
                              <input style={{ width: 90, fontSize: 11 }} className="form-input"
                                value={form.buyer_name} onChange={e => set('buyer_name', e.target.value)} placeholder="Buyer" />
                            </td>
                            <td>
                              <input style={{ width: 100, fontSize: 11 }} className="form-input"
                                value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes" />
                            </td>
                            <td>
                              <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(o.id)} disabled={saving} style={{ marginRight: 4 }}>✓</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>✕</button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={o.id}>
                            <td style={{ color: 'var(--text-muted)' }}>{i+1}</td>
                            <td style={{ color: o.sex === 'male' ? 'var(--blue-text)' : o.sex === 'female' ? 'var(--purple-text)' : 'var(--text-muted)' }}>
                              {o.sex === 'male' ? '♂' : o.sex === 'female' ? '♀' : '?'}
                            </td>
                            <td>{o.hatch_weight_grams ? `${o.hatch_weight_grams}g` : '—'}</td>
                            <td style={{ color: dispositionColor(o.disposition) }}>{o.disposition}</td>
                            <td>{o.sale_price ? `$${o.sale_price}` : '—'}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{o.buyer_name || '—'}</td>
                            <td style={{ color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.notes || '—'}</td>
                            <td style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(o)} style={{ fontSize: 11 }}>Edit</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(o.id)} style={{ fontSize: 11, color: 'var(--red-text)' }}>×</button>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {offspring.length === 0 && !showAdd && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>No offspring logged yet.</p>
              )}

              {/* Add offspring form */}
              {showAdd && (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ minWidth: 80 }}>
                      <label className="form-label">Sex</label>
                      <select className="form-select" style={{ fontSize: 12 }} value={form.sex} onChange={e => set('sex', e.target.value)}>
                        <option value="unknown">Unknown</option>
                        <option value="male">♂ Male</option>
                        <option value="female">♀ Female</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ minWidth: 90 }}>
                      <label className="form-label">Hatch wt (g)</label>
                      <input type="number" className="form-input" style={{ fontSize: 12 }}
                        value={form.hatch_weight_grams} onChange={e => set('hatch_weight_grams', e.target.value)} placeholder="e.g. 65" />
                    </div>
                    <div className="form-group" style={{ minWidth: 100 }}>
                      <label className="form-label">Disposition</label>
                      <select className="form-select" style={{ fontSize: 12 }} value={form.disposition} onChange={e => set('disposition', e.target.value)}>
                        {['unknown','kept','sold','traded','died'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {(form.disposition === 'sold' || form.disposition === 'traded') && <>
                      <div className="form-group" style={{ minWidth: 80 }}>
                        <label className="form-label">Sale price</label>
                        <input type="number" className="form-input" style={{ fontSize: 12 }}
                          value={form.sale_price} onChange={e => set('sale_price', e.target.value)} placeholder="$" />
                      </div>
                      <div className="form-group" style={{ minWidth: 110 }}>
                        <label className="form-label">Buyer</label>
                        <input className="form-input" style={{ fontSize: 12 }}
                          value={form.buyer_name} onChange={e => set('buyer_name', e.target.value)} placeholder="Name" />
                      </div>
                    </>}
                    <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                      <label className="form-label">Notes</label>
                      <input className="form-input" style={{ fontSize: 12 }}
                        value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Morph notes, etc." />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={saving}>{saving ? 'Adding…' : 'Add baby'}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowAdd(false); setForm(emptyForm) }}>Cancel</button>
                  </div>
                </div>
              )}

              {!showAdd && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(true)}>+ Log offspring</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
