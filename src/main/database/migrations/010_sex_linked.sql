-- ============================================================
-- Migration 010 - Sex-linked inheritance support
-- ============================================================
-- Rebuilds the morphs table to add 'sex_linked' to the
-- inheritance_type CHECK constraint and add is_sex_linked column.
--
-- Strategy: copy data into a temp table, drop morphs, recreate
-- morphs with updated schema, copy back, drop temp.
-- This avoids leaving any 'morphs_old' table behind.

-- ── Step 1: Copy existing data into a temp table ─────────────
CREATE TABLE morphs_migration_tmp AS SELECT * FROM morphs;

-- ── Step 2: Drop the original morphs table ───────────────────
DROP TABLE morphs;

-- ── Step 3: Recreate morphs with updated CHECK ───────────────
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
  is_user_created     INTEGER NOT NULL DEFAULT 0,
  allele_group_id     TEXT REFERENCES allele_groups(id),
  cross_allele_result TEXT,
  is_sex_linked       INTEGER NOT NULL DEFAULT 0
);

-- ── Step 4: Copy data back ────────────────────────────────────
INSERT INTO morphs (
  id, species_id, name, gene_symbol, category, inheritance_type,
  super_form_name, has_health_concern, health_concern_desc, description,
  also_known_as, discovered_year, is_combo, combo_components, sort_order,
  created_at, is_user_created, allele_group_id, cross_allele_result, is_sex_linked
)
SELECT
  id, species_id, name, gene_symbol, category, inheritance_type,
  super_form_name, has_health_concern, health_concern_desc, description,
  also_known_as, discovered_year, is_combo, combo_components, sort_order,
  created_at,
  COALESCE(is_user_created, 0),
  COALESCE(allele_group_id, NULL),
  COALESCE(cross_allele_result, NULL),
  0
FROM morphs_migration_tmp;

-- ── Step 5: Restore indexes ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_morphs_species      ON morphs(species_id);
CREATE INDEX IF NOT EXISTS idx_morphs_inheritance  ON morphs(inheritance_type);
CREATE INDEX IF NOT EXISTS idx_morphs_allele_group ON morphs(allele_group_id);

-- ── Step 6: Drop temp table ───────────────────────────────────
DROP TABLE morphs_migration_tmp;

-- ── Step 7: Update Banana and Coral Glow ─────────────────────
UPDATE morphs SET
  inheritance_type    = 'sex_linked',
  is_sex_linked       = 1,
  has_health_concern  = 1,
  health_concern_desc = 'Sex-linked inheritance: male Bananas are either Male Makers (~93% male Banana offspring) or Female Makers (~93% female Banana offspring), depending on whether their own Banana parent was male or female. Females always produce normal 50/50 sex ratios. Super Banana also produces 50/50. Track maker status carefully when planning pairings.'
WHERE id IN ('bp_banana', 'bp_coral_glow');

-- ── Step 8: Add sex_linked_maker to animals ───────────────────
ALTER TABLE animals ADD COLUMN sex_linked_maker TEXT;
