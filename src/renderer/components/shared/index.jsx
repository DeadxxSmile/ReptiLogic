import React from 'react'
import { inheritanceLabel, expressionLabel } from '../../utils/format'

// ── MorphTag ─────────────────────────────────────────────────────────────────
export function MorphTag({ morph, size = 'sm' }) {
  const type = morph.inheritance_type || morph.inheritanceType
  const expr = morph.expression
  const name = morph.morph_name || morph.morphName || morph.name

  const label = expr && expr !== 'visual'
    ? `${expressionLabel(expr, morph.super_form_name)} ${name}`
    : name

  return (
    <span
      className={`badge badge-${type}`}
      title={`${inheritanceLabel(type)}${morph.has_health_concern ? ' ⚠ Health concern' : ''}`}
      style={{ fontSize: size === 'xs' ? '10px' : '11px' }}
    >
      {morph.has_health_concern && <span style={{ color: 'var(--amber-text)' }}>⚠</span>}
      {label}
    </span>
  )
}

// ── MorphTagList ─────────────────────────────────────────────────────────────
export function MorphTagList({ morphs = [], max = 99 }) {
  const visible = morphs.slice(0, max)
  const extra   = morphs.length - visible.length

  return (
    <div className="tag-list">
      {visible.map((m, i) => (
        <MorphTag key={m.morph_id || m.morphId || i} morph={m} />
      ))}
      {extra > 0 && (
        <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          +{extra} more
        </span>
      )}
    </div>
  )
}

// ── AnimalPhoto ───────────────────────────────────────────────────────────────
export function AnimalPhoto({ filename, name, size = 64, style = {} }) {
  const [src, setSrc] = React.useState(null)
  const [errored, setErrored] = React.useState(false)

  React.useEffect(() => {
    if (!filename) return
    window.api.photos.getPath(filename).then(setSrc).catch(() => setErrored(true))
  }, [filename])

  const initials = (name || '?').slice(0, 2).toUpperCase()

  if (!filename || errored || !src) {
    return (
      <div style={{
        width: size, height: size,
        borderRadius: size > 48 ? 'var(--radius-lg)' : 'var(--radius-md)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.3, color: 'var(--text-muted)',
        flexShrink: 0,
        ...style
      }}>
        {initials}
      </div>
    )
  }

  return (
    <img
      src={`file://${src}`}
      alt={name}
      style={{
        width: size, height: size,
        borderRadius: size > 48 ? 'var(--radius-lg)' : 'var(--radius-md)',
        objectFit: 'cover',
        border: '1px solid var(--border)',
        flexShrink: 0,
        ...style
      }}
      onError={() => setErrored(true)}
    />
  )
}

// ── SexBadge ──────────────────────────────────────────────────────────────────
export function SexBadge({ sex }) {
  return (
    <span className={`badge badge-${sex}`}>
      {sex === 'male' ? '♂ Male' : sex === 'female' ? '♀ Female' : '? Unknown'}
    </span>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const colors = {
    active:   { bg: 'var(--accent-dim)',   color: 'var(--accent-text)' },
    sold:     { bg: 'var(--bg-elevated)',  color: 'var(--text-muted)'  },
    deceased: { bg: 'var(--red-dim)',      color: 'var(--red-text)'    },
    on_loan:  { bg: 'var(--amber-dim)',    color: 'var(--amber-text)'  },
  }
  const c = colors[status] || colors.active
  return (
    <span className="badge" style={{ background: c.bg, color: c.color }}>
      {status?.replace('_', ' ')}
    </span>
  )
}

// ── BreedingStatusBadge ───────────────────────────────────────────────────────
export function BreedingStatusBadge({ status }) {
  const colors = {
    planned:   { bg: 'var(--bg-elevated)', color: 'var(--text-muted)'    },
    active:    { bg: 'var(--blue-dim)',    color: 'var(--blue-text)'     },
    gravid:    { bg: 'var(--purple-dim)',  color: 'var(--purple-text)'   },
    laid:      { bg: 'var(--amber-dim)',   color: 'var(--amber-text)'    },
    hatched:   { bg: 'var(--accent-dim)',  color: 'var(--accent-text)'   },
    failed:    { bg: 'var(--red-dim)',     color: 'var(--red-text)'      },
    cancelled: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)'   },
  }
  const c = colors[status] || colors.planned
  return (
    <span className="badge" style={{ background: c.bg, color: c.color }}>
      {status}
    </span>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      {title   && <h3>{title}</h3>}
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 24px', color: 'var(--text-muted)' }}>
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}

// ── PageError ─────────────────────────────────────────────────────────────────
export function PageError({ message }) {
  return (
    <div style={{ padding: 24, color: 'var(--red-text)', background: 'var(--red-dim)', borderRadius: 'var(--radius-md)', margin: 24 }}>
      ⚠ {message}
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ maxWidth: 400, width: '90%' }}>
        <h3 style={{ marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SearchInput ───────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-muted)', pointerEvents: 'none', fontSize: 14
      }}>🔍</span>
      <input
        type="search"
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: 32, width: 240 }}
      />
    </div>
  )
}

// ── StatTile ──────────────────────────────────────────────────────────────────
export function StatTile({ label, value, sub, color }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile-label">{label}</div>
      <div className="stat-tile-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="stat-tile-sub">{sub}</div>}
    </div>
  )
}
