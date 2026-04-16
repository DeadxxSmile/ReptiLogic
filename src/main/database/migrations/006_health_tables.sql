-- ============================================================
-- Migration 006 — Health tracking tables
-- ============================================================

-- ── Health issues / conditions ────────────────────────────────
CREATE TABLE IF NOT EXISTS health_issues (
  id            TEXT PRIMARY KEY,
  animal_id     TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'general'
    CHECK(category IN ('injury','infection','parasite','respiratory','neurological','digestive','shed','other','general')),
  severity      TEXT NOT NULL DEFAULT 'minor'
    CHECK(severity IN ('minor','moderate','serious','critical')),
  status        TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active','monitoring','resolved')),
  onset_date    TEXT,
  resolved_date TEXT,
  description   TEXT,
  treatment     TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_health_issues_animal ON health_issues(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_issues_status ON health_issues(status);

-- ── Vet visits ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vet_visits (
  id            TEXT PRIMARY KEY,
  animal_id     TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  visit_date    TEXT NOT NULL,
  vet_name      TEXT,
  clinic_name   TEXT,
  reason        TEXT NOT NULL,
  diagnosis     TEXT,
  treatment     TEXT,
  follow_up_date TEXT,
  cost          REAL,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vet_visits_animal ON vet_visits(animal_id);

-- ── Medications ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
  id            TEXT PRIMARY KEY,
  animal_id     TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  dosage        TEXT,
  frequency     TEXT,
  route         TEXT,         -- e.g. 'oral', 'topical', 'injection'
  start_date    TEXT,
  end_date      TEXT,
  prescribed_by TEXT,
  reason        TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_medications_animal ON medications(animal_id);
CREATE INDEX IF NOT EXISTS idx_medications_active  ON medications(active);
