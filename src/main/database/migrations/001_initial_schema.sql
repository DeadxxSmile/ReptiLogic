-- ============================================================
-- Migration 001 - Initial schema
-- ReptiLogic · species-extensible design
-- ============================================================

-- ── Species ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS species (
  id            TEXT PRIMARY KEY,          -- e.g. 'ball_python'
  common_name   TEXT NOT NULL,             -- e.g. 'Ball Python'
  scientific_name TEXT,                    -- e.g. 'Python regius'
  avg_clutch_size INTEGER,
  incubation_days_min INTEGER,
  incubation_days_max INTEGER,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Morphs master list ────────────────────────────────────────
-- One row per gene/morph. Animal-specific expression tracked in animal_morphs.
CREATE TABLE IF NOT EXISTS morphs (
  id                  TEXT PRIMARY KEY,
  species_id          TEXT NOT NULL REFERENCES species(id),
  name                TEXT NOT NULL,
  gene_symbol         TEXT,                -- short code, e.g. 'bp', 'ax', 'pst'
  category            TEXT,                -- visual grouping, e.g. 'Recessive', 'Co-dominant'
  inheritance_type    TEXT NOT NULL        -- 'recessive' | 'co_dominant' | 'dominant' | 'line_bred' | 'polygenetic'
    CHECK(inheritance_type IN ('recessive','co_dominant','dominant','line_bred','polygenetic')),
  super_form_name     TEXT,                -- for co-doms: name of the homozygous super form
  has_health_concern  INTEGER NOT NULL DEFAULT 0,  -- 1 = yes
  health_concern_desc TEXT,                -- e.g. 'Neurological wobble'
  description         TEXT,
  also_known_as       TEXT,                -- comma-separated aliases
  discovered_year     INTEGER,
  is_combo            INTEGER NOT NULL DEFAULT 0,  -- 1 = combination morph (no new gene)
  combo_components    TEXT,                -- JSON array of morph IDs that make this combo
  sort_order          INTEGER DEFAULT 999,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_morphs_species ON morphs(species_id);
CREATE INDEX IF NOT EXISTS idx_morphs_inheritance ON morphs(inheritance_type);

-- ── Animals ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS animals (
  id              TEXT PRIMARY KEY,
  species_id      TEXT NOT NULL REFERENCES species(id),
  name            TEXT NOT NULL,
  sex             TEXT NOT NULL CHECK(sex IN ('male','female','unknown')),
  dob             TEXT,                    -- ISO date string, nullable if unknown
  dob_estimated   INTEGER NOT NULL DEFAULT 0,
  weight_grams    REAL,
  length_cm       REAL,
  acquired_date   TEXT,
  acquired_from   TEXT,
  acquisition_price REAL,
  proved_out      INTEGER NOT NULL DEFAULT 0,  -- has been used in breeding
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active','sold','deceased','on_loan')),
  status_date     TEXT,
  status_notes    TEXT,
  primary_photo_id TEXT,                   -- FK set after photos table exists
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species_id);
CREATE INDEX IF NOT EXISTS idx_animals_status  ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_sex     ON animals(sex);

-- ── Animal morphs ─────────────────────────────────────────────
-- Tracks which genes an animal has and at what confidence level
CREATE TABLE IF NOT EXISTS animal_morphs (
  id          TEXT PRIMARY KEY,
  animal_id   TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  morph_id    TEXT NOT NULL REFERENCES morphs(id),
  expression  TEXT NOT NULL DEFAULT 'visual'
    CHECK(expression IN ('visual','het','possible_het','super','proven_het')),
  het_percent INTEGER,                     -- for possible_het: 50, 66, etc.
  confirmed   INTEGER NOT NULL DEFAULT 0,  -- 1 = genetically confirmed
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(animal_id, morph_id)
);

CREATE INDEX IF NOT EXISTS idx_animal_morphs_animal ON animal_morphs(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_morphs_morph  ON animal_morphs(morph_id);

-- ── Photos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id          TEXT PRIMARY KEY,
  animal_id   TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,               -- stored filename in app data folder
  original_name TEXT,
  is_primary  INTEGER NOT NULL DEFAULT 0,
  caption     TEXT,
  taken_at    TEXT,                        -- date photo was taken
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_photos_animal ON photos(animal_id);

-- ── Breeding records ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS breeding_records (
  id              TEXT PRIMARY KEY,
  species_id      TEXT NOT NULL REFERENCES species(id),
  male_id         TEXT NOT NULL REFERENCES animals(id),
  female_id       TEXT NOT NULL REFERENCES animals(id),
  -- Key dates
  first_pairing_date TEXT,
  last_pairing_date  TEXT,
  lock_date          TEXT,                 -- confirmed lock observed
  confirmed_ovulation_date TEXT,
  pre_lay_shed_date  TEXT,
  -- Status
  status          TEXT NOT NULL DEFAULT 'planned'
    CHECK(status IN ('planned','active','gravid','laid','hatched','failed','cancelled')),
  pairing_count   INTEGER NOT NULL DEFAULT 0,
  -- Outcome summary (denormalised for quick display)
  total_eggs      INTEGER,
  fertile_eggs    INTEGER,
  slug_count      INTEGER,
  hatched_count   INTEGER,
  -- Notes
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_breeding_male   ON breeding_records(male_id);
CREATE INDEX IF NOT EXISTS idx_breeding_female ON breeding_records(female_id);
CREATE INDEX IF NOT EXISTS idx_breeding_status ON breeding_records(status);

-- ── Clutches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clutches (
  id                TEXT PRIMARY KEY,
  breeding_record_id TEXT NOT NULL REFERENCES breeding_records(id) ON DELETE CASCADE,
  -- Dates
  lay_date          TEXT,
  hatch_date        TEXT,
  -- Counts
  total_eggs        INTEGER NOT NULL DEFAULT 0,
  fertile_eggs      INTEGER,
  slug_count        INTEGER NOT NULL DEFAULT 0,
  hatched_count     INTEGER,
  -- Incubation
  incubation_temp_f REAL,
  incubation_humidity_pct REAL,
  incubator_type    TEXT,
  -- Notes
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Offspring ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offspring (
  id                TEXT PRIMARY KEY,
  clutch_id         TEXT NOT NULL REFERENCES clutches(id) ON DELETE CASCADE,
  breeding_record_id TEXT NOT NULL REFERENCES breeding_records(id),
  -- If animal is kept, link to animals table
  animal_id         TEXT REFERENCES animals(id),
  -- Quick fields for animals that aren't kept
  sex               TEXT CHECK(sex IN ('male','female','unknown')),
  hatch_date        TEXT,
  hatch_weight_grams REAL,
  -- Sale / disposition
  disposition       TEXT NOT NULL DEFAULT 'unknown'
    CHECK(disposition IN ('kept','sold','traded','died','unknown')),
  sale_price        REAL,
  buyer_name        TEXT,
  sale_date         TEXT,
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_offspring_clutch   ON offspring(clutch_id);
CREATE INDEX IF NOT EXISTS idx_offspring_animal   ON offspring(animal_id);

-- ── Weight/length log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS measurements (
  id          TEXT PRIMARY KEY,
  animal_id   TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  measured_at TEXT NOT NULL DEFAULT (datetime('now')),
  weight_grams REAL,
  length_cm   REAL,
  notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_measurements_animal ON measurements(animal_id);

-- ── Feeding log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedings (
  id          TEXT PRIMARY KEY,
  animal_id   TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  fed_at      TEXT NOT NULL DEFAULT (datetime('now')),
  prey_type   TEXT,                        -- e.g. 'frozen mouse', 'rat pup'
  prey_size   TEXT,                        -- e.g. 'small', 'medium', 'large'
  prey_weight_grams REAL,
  live        INTEGER NOT NULL DEFAULT 0,
  refused     INTEGER NOT NULL DEFAULT 0,
  notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedings_animal ON feedings(animal_id);

-- ── Pairing log ───────────────────────────────────────────────
-- Individual pairing events within a breeding record
CREATE TABLE IF NOT EXISTS pairing_events (
  id                TEXT PRIMARY KEY,
  breeding_record_id TEXT NOT NULL REFERENCES breeding_records(id) ON DELETE CASCADE,
  paired_at         TEXT NOT NULL,
  duration_minutes  INTEGER,
  lock_observed     INTEGER NOT NULL DEFAULT 0,
  notes             TEXT
);

-- ── Settings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('weight_unit',       'grams'),
  ('length_unit',       'cm'),
  ('temp_unit',         'fahrenheit'),
  ('default_species',   'ball_python'),
  ('theme',             'dark');
