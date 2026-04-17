-- ============================================================
-- Migration 010 - Sex-linked inheritance support
-- ============================================================
-- SQLite CHECK constraints can't be altered, so we must recreate
-- the morphs table with 'sex_linked' added to the inheritance_type CHECK.

-- ── Step 1: Rename existing morphs table ─────────────────────
ALTER TABLE morphs RENAME TO morphs_old;

-- ── Step 2: Recreate morphs with updated CHECK ───────────────
CREATE TABLE morphs (
  id                  TEXT PRIMARY KEY,
  species_id          TEXT NOT NULL REFERENCES species(id),
  name                TEXT NOT NULL,
  gene_symbol         TEXT,
  category            TEXT,
  inheritance_type    TEXT NOT NULL
    CHECK(inheritance_type IN ('recessive','co_dominant','dominant','line_bred','polygenetic','sex_linked')),
  super_form_name     TEXT,
  has_health_concern  INTEGER NOT NULL DEFAULT 0,
  health_concern_desc TEXT,
  description         TEXT,
  also_known_as       TEXT,
  discovered_year     INTEGER,
  is_combo            INTEGER NOT NULL DEFAULT 0,
  combo_components    TEXT,
  sort_order          INTEGER DEFAULT 999,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  -- Added by migration 007
  is_user_created     INTEGER NOT NULL DEFAULT 0,
  -- Added by migration 009
  allele_group_id     TEXT REFERENCES allele_groups(id),
  cross_allele_result TEXT,
  -- Added by migration 010
  is_sex_linked       INTEGER NOT NULL DEFAULT 0
);

-- ── Step 3: Copy all data back ───────────────────────────────
INSERT INTO morphs
  SELECT
    id, species_id, name, gene_symbol, category, inheritance_type,
    super_form_name, has_health_concern, health_concern_desc, description,
    also_known_as, discovered_year, is_combo, combo_components, sort_order, created_at,
    COALESCE(is_user_created, 0),
    COALESCE(allele_group_id, NULL),
    COALESCE(cross_allele_result, NULL),
    0  -- is_sex_linked default
  FROM morphs_old;

-- ── Step 4: Restore indexes ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_morphs_species      ON morphs(species_id);
CREATE INDEX IF NOT EXISTS idx_morphs_inheritance  ON morphs(inheritance_type);
CREATE INDEX IF NOT EXISTS idx_morphs_allele_group ON morphs(allele_group_id);

-- ── Step 5: Drop old table ────────────────────────────────────
DROP TABLE morphs_old;

-- ── Step 6: Update Banana and Coral Glow ─────────────────────
UPDATE morphs SET
  inheritance_type    = 'sex_linked',
  is_sex_linked       = 1,
  has_health_concern  = 1,
  health_concern_desc = 'Sex-linked inheritance: male Bananas are either Male Makers (~93% male Banana offspring) or Female Makers (~93% female Banana offspring), depending on whether their own Banana parent was male or female. Females always produce normal 50/50 sex ratios. Super Banana also produces 50/50. Track maker status carefully when planning pairings.'
WHERE id IN ('bp_banana', 'bp_coral_glow');

-- ── Step 7: Add sex_linked_maker to animals ───────────────────
ALTER TABLE animals ADD COLUMN sex_linked_maker TEXT;
