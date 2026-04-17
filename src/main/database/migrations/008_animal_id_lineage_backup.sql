-- ============================================================
-- Migration 008 - Animal IDs, lineage, live-birth, backup settings
-- ============================================================

-- ── Animal ID field ───────────────────────────────────────────
ALTER TABLE animals ADD COLUMN animal_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_animals_animal_id ON animals(animal_id) WHERE animal_id IS NOT NULL;

-- ── Lineage (parent tracking) ─────────────────────────────────
ALTER TABLE animals ADD COLUMN father_id TEXT REFERENCES animals(id);
ALTER TABLE animals ADD COLUMN mother_id TEXT REFERENCES animals(id);

CREATE INDEX IF NOT EXISTS idx_animals_father ON animals(father_id);
CREATE INDEX IF NOT EXISTS idx_animals_mother ON animals(mother_id);

-- ── Species: live-birth flag ──────────────────────────────────
ALTER TABLE species ADD COLUMN gives_live_birth INTEGER NOT NULL DEFAULT 0;
ALTER TABLE species ADD COLUMN litter_size_min INTEGER;
ALTER TABLE species ADD COLUMN litter_size_max INTEGER;

-- Update known live-birth species
UPDATE species SET gives_live_birth = 1, litter_size_min = 10, litter_size_max = 60
  WHERE id IN ('boa_constrictor', 'rainbow_boa', 'rosy_boa');

-- ── Clutch/litter: generalize for live births ─────────────────
ALTER TABLE clutches ADD COLUMN is_live_birth INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clutches ADD COLUMN birth_date TEXT;  -- alias for live births

-- ── Animal ID counter (per species) ──────────────────────────
CREATE TABLE IF NOT EXISTS animal_id_counters (
  species_id  TEXT NOT NULL,
  sex         TEXT NOT NULL,
  counter     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (species_id, sex)
);

-- ── Backup settings ────────────────────────────────────────────
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('backup_enabled',        '0'),
  ('backup_folder',         ''),
  ('backup_trigger',        'on_close'),   -- 'on_open' | 'on_close'
  ('backup_keep_count',     '10'),
  ('breeder_name',          ''),
  ('breeder_logo_path',     ''),
  ('animal_id_mode',        'auto');       -- 'auto' | 'manual'

-- ── Breeder socials / contact ─────────────────────────────────────────────────
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('breeder_website',   ''),
  ('breeder_instagram', ''),
  ('breeder_facebook',  ''),
  ('breeder_x',         ''),
  ('breeder_youtube',   ''),
  ('breeder_tiktok',    '');
