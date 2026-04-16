import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAsync } from '../hooks/useData'
import {
  AnimalPhoto, MorphTagList, BreedingStatusBadge,
  LoadingSpinner, StatTile, EmptyState
} from '../components/shared'
import { formatDate, ageString, timeAgo, formatWeight, pluralise } from '../utils/format'
import './DashboardPage.css'

export default function DashboardPage() {
  const { data, loading, refetch } = useAsync(() => window.api.dashboard.getSummary(), [])
  const navigate = useNavigate()

  if (loading) return <LoadingSpinner label="Loading dashboard…" />
  if (!data)   return null

  const { collection, breeding, needsWeighing, needsFeeding, activeBreeding, recentClutches, recentAnimals } = data

  const hatchRate = breeding.total_eggs > 0
    ? Math.round((breeding.total_hatched / breeding.total_eggs) * 100)
    : null

  return (
    <div className="dashboard-page">

      {/* ── Greeting ───────────────────────────────────────── */}
      <div className="dashboard-greeting">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary">{greeting()} Here's your collection at a glance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/collection/add')}>+ Add Animal</button>
      </div>

      {/* ── Top stats ──────────────────────────────────────── */}
      <div className="dashboard-stats">
        <StatTile label="Active animals" value={collection.total || 0} sub={`${collection.species_count} species`} />
        <StatTile label="Males"          value={collection.males || 0}   color="var(--blue-text)" />
        <StatTile label="Females"        value={collection.females || 0} color="var(--purple-text)" />
        <StatTile label="Active pairings" value={breeding.active || 0}  color="var(--amber-text)" />
        <StatTile label="Gravid females"  value={breeding.gravid || 0}  color="var(--purple-text)" />
        <StatTile label="Eggs this season" value={breeding.total_eggs || 0} />
        <StatTile label="Hatched"         value={breeding.total_hatched || 0} color="var(--accent-text)" />
        {hatchRate !== null && <StatTile label="Hatch rate" value={`${hatchRate}%`} color={hatchRate > 70 ? 'var(--accent-text)' : 'var(--amber-text)'} />}
      </div>

      <div className="dashboard-grid">

        {/* ── Left column ────────────────────────────────────── */}
        <div className="dashboard-col">

          {/* Active breeding */}
          {activeBreeding?.length > 0 && (
            <DashSection title="Active breeding" linkTo="/breeding" linkLabel="View all">
              {activeBreeding.map(r => (
                <Link key={r.id} to={`/breeding/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div className="dash-breeding-row">
                    <div className="dash-breeding-names">
                      <span><span style={{ color: 'var(--blue-text)' }}>♂</span> {r.male_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>×</span>
                      <span><span style={{ color: 'var(--purple-text)' }}>♀</span> {r.female_name}</span>
                    </div>
                    <BreedingStatusBadge status={r.status} />
                  </div>
                </Link>
              ))}
            </DashSection>
          )}

          {/* Recent clutches */}
          {recentClutches?.length > 0 && (
            <DashSection title="Recent clutches" linkTo="/breeding">
              {recentClutches.map(c => (
                <div key={c.id} className="dash-clutch-row">
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.male_name} × {c.female_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Laid {formatDate(c.lay_date)}
                      {c.hatch_date && <span style={{ color: 'var(--accent-text)' }}> · Hatched {formatDate(c.hatch_date)}</span>}
                    </div>
                  </div>
                  <div className="dash-clutch-counts">
                    <span title="Total eggs">🥚 {c.total_eggs || 0}</span>
                    {c.slug_count > 0 && <span title="Slugs" style={{ color: 'var(--red-text)' }}>✕ {c.slug_count}</span>}
                    {c.hatched_count > 0 && <span title="Hatched" style={{ color: 'var(--accent-text)' }}>🐍 {c.hatched_count}</span>}
                  </div>
                </div>
              ))}
            </DashSection>
          )}

          {/* Recent animals */}
          {recentAnimals?.length > 0 && (
            <DashSection title="Recently added" linkTo="/collection" linkLabel="View all">
              <div className="dash-animal-grid">
                {recentAnimals.map(a => (
                  <Link key={a.id} to={`/collection/${a.id}`} style={{ textDecoration: 'none' }}>
                    <div className="dash-animal-card">
                      <AnimalPhoto filename={a.primary_photo_filename} name={a.name} size={52} />
                      <div style={{ minWidth: 0 }}>
                        <div className="truncate" style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {a.sex === 'male' ? '♂' : a.sex === 'female' ? '♀' : '?'} {a.species_name}
                        </div>
                        <MorphTagList morphs={a.morphs || []} max={2} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </DashSection>
          )}
        </div>

        {/* ── Right column: care reminders ─────────────────── */}
        <div className="dashboard-col">

          {/* Needs feeding */}
          {needsFeeding?.length > 0 && (
            <DashSection title="⚠ Feeding reminders" accent="amber">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                These animals haven't had a logged feeding in 14+ days.
              </p>
              {needsFeeding.map(a => (
                <CareReminderRow
                  key={a.id}
                  animal={a}
                  subLabel={a.last_fed ? `Last fed ${timeAgo(a.last_fed)}` : 'No feedings logged'}
                  onClick={() => navigate(`/collection/${a.id}`)}
                />
              ))}
            </DashSection>
          )}

          {/* Needs weighing */}
          {needsWeighing?.length > 0 && (
            <DashSection title="📏 Weigh reminders" accent="blue">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                These animals haven't been weighed in 30+ days.
              </p>
              {needsWeighing.map(a => (
                <CareReminderRow
                  key={a.id}
                  animal={a}
                  subLabel={a.last_weighed ? `Last weighed ${timeAgo(a.last_weighed)}` : 'Never weighed'}
                  onClick={() => navigate(`/collection/${a.id}`)}
                />
              ))}
            </DashSection>
          )}

          {/* Empty state when everything is on track */}
          {needsFeeding?.length === 0 && needsWeighing?.length === 0 && (
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <h3 style={{ marginBottom: 4 }}>All caught up!</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No care reminders right now.</p>
            </div>
          )}

          {/* Quick links */}
          <DashSection title="Quick actions">
            <div className="quick-actions">
              {[
                { label: '+ Add animal',      to: '/collection/add', icon: '🐍' },
                { label: '+ New pairing',     to: '/breeding',       icon: '🥚', state: { openNew: true } },
                { label: 'Genetics calc',     to: '/genetics',       icon: '🧬' },
                { label: 'Browse morphs',     to: '/morphs',         icon: '📖' },
              ].map(({ label, to, icon }) => (
                <button key={label} className="quick-action-btn" onClick={() => navigate(to)}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 13 }}>{label}</span>
                </button>
              ))}
            </div>
          </DashSection>

        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DashSection({ title, children, linkTo, linkLabel = 'See all', accent }) {
  const navigate = useNavigate()
  const accentColors = {
    amber: { border: 'rgba(230,168,23,0.4)', title: 'var(--amber-text)' },
    blue:  { border: 'rgba(74,143,212,0.4)', title: 'var(--blue-text)'  },
  }
  const ac = accent ? accentColors[accent] : null

  return (
    <div className="card dash-section" style={ac ? { borderColor: ac.border } : {}}>
      <div className="dash-section-header">
        <h3 style={ac ? { color: ac.title } : {}}>{title}</h3>
        {linkTo && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(linkTo)} style={{ fontSize: 12 }}>
            {linkLabel} →
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function CareReminderRow({ animal, subLabel, onClick }) {
  return (
    <div className="care-reminder-row" onClick={onClick}>
      <AnimalPhoto filename={animal.primary_photo_filename} name={animal.name} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{animal.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{animal.species_name} · {subLabel}</div>
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>›</span>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 18) return 'Good afternoon.'
  return 'Good evening.'
}
