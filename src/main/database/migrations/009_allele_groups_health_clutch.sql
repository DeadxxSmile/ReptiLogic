-- ============================================================
-- Migration 009 - Allele groups, health concern data, clutch ranges
-- ============================================================

-- ── Allele group table ────────────────────────────────────────
-- Morphs in the same allele group occupy the same chromosomal locus.
-- Two alleles from the same group in one animal = a "cross-allele super" (e.g. BEL).
CREATE TABLE IF NOT EXISTS allele_groups (
  id          TEXT PRIMARY KEY,
  species_id  TEXT NOT NULL REFERENCES species(id),
  name        TEXT NOT NULL,          -- e.g. 'BEL Complex', 'Yellow Belly Complex'
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE morphs ADD COLUMN allele_group_id TEXT REFERENCES allele_groups(id);
ALTER TABLE morphs ADD COLUMN cross_allele_result TEXT; -- name shown when two diff alleles in same group combine

CREATE INDEX IF NOT EXISTS idx_morphs_allele_group ON morphs(allele_group_id);

-- ── BEL Complex allele group ──────────────────────────────────
INSERT OR IGNORE INTO allele_groups (id, species_id, name, description) VALUES
  ('bp_bel_complex', 'ball_python', 'BEL Complex',
   'Blue Eyed Leucistic complex. Any two alleles from this group produce a BEL (white snake with blue eyes). Members: Lesser, Butter, Mojave, Phantom, Mystic, Russo, Special, Mocha, Bamboo.'),
  ('bp_yb_complex', 'ball_python', 'Yellow Belly Complex',
   'Yellow Belly allelic series. YB, Gravel, Asphalt all share a locus. Super of any = Ivory-like. Cross-allele supers resemble Ivory.'),
  ('bp_cinnabar_complex', 'ball_python', '8-Ball Complex',
   'Cinnamon and Black Pastel share the same locus. Super Cinnamon = Black Pastel and vice versa. Cross produces same super form.');

-- Assign BEL complex members
UPDATE morphs SET allele_group_id = 'bp_bel_complex', cross_allele_result = 'Blue Eyed Leucistic (BEL)'
  WHERE id IN ('bp_lesser','bp_mojave','bp_phantom','bp_mystic','bp_butter','bp_mocha','bp_russo_cod','bp_special');

-- Butter historically grouped with Lesser (same locus confirmed 2025)
-- We keep them separate morphs but same group
UPDATE morphs SET allele_group_id = 'bp_bel_complex', cross_allele_result = 'Blue Eyed Leucistic (BEL)'
  WHERE id = 'bp_butter';

-- Yellow Belly complex
UPDATE morphs SET allele_group_id = 'bp_yb_complex', cross_allele_result = 'Ivory'
  WHERE id IN ('bp_yellow_belly','bp_gravel','bp_asphalt');

-- Cinnamon / Black Pastel complex
UPDATE morphs SET allele_group_id = 'bp_cinnabar_complex', cross_allele_result = 'Super Black Pastel / Super Cinnamon'
  WHERE id IN ('bp_cinnamon','bp_black_pastel');

-- ── Fix health concern data ───────────────────────────────────
-- Spider wobble (already set but let's update description)
UPDATE morphs SET has_health_concern = 1,
  health_concern_desc = 'Neurological wobble — inner ear deformity causing head tremors and balance issues. Severity varies widely. Super Spider is rarely viable.'
  WHERE id = 'bp_spider';

-- Champagne wobble
UPDATE morphs SET has_health_concern = 1,
  health_concern_desc = 'Neurological wobble similar to Spider. Super Champagne is rarely produced and thought to be lethal or severely affected.'
  WHERE id = 'bp_champagne';

-- Woma wobble
UPDATE morphs SET has_health_concern = 1,
  health_concern_desc = 'Mild neurological wobble reported in some individuals. Severity typically less than Spider.'
  WHERE id = 'bp_woma';

-- Cinnamon super kinking
UPDATE morphs SET has_health_concern = 1,
  health_concern_desc = 'Super Cinnamon (Black Pastel) has elevated risk of spinal kinking and duckbill facial deformity.'
  WHERE id IN ('bp_cinnamon','bp_black_pastel');

-- Super Lesser bug eyes
UPDATE morphs SET has_health_concern = 1,
  health_concern_desc = 'Super Lesser (Butter) can produce animals with enlarged protruding eyes (macrophthalmia / bug eyes).'
  WHERE id IN ('bp_lesser','bp_butter');

-- Caramel albino kinking
UPDATE morphs SET has_health_concern = 1,
  health_concern_desc = 'Prone to severe spinal kinking and female fertility issues, particularly in certain lines.'
  WHERE id IN ('bp_ultramel','bp_caramel');

-- Albino light sensitivity
UPDATE morphs SET has_health_concern = 1,
  health_concern_desc = 'Light sensitivity (photophobia) due to lack of melanin in eyes. Avoid bright direct lighting.'
  WHERE id = 'bp_albino';

-- Lavender albino kinking
UPDATE morphs SET has_health_concern = 1,
  health_concern_desc = 'Some lines show increased kinking. Generally healthy but worth monitoring.'
  WHERE id = 'bp_lavender';

-- ── Species clutch/litter size ranges ────────────────────────
UPDATE species SET
  incubation_days_min = 54, incubation_days_max = 60,
  avg_clutch_size = 6,
  litter_size_min = 1, litter_size_max = 11
WHERE id = 'ball_python';

UPDATE species SET
  incubation_days_min = 56, incubation_days_max = 64,
  avg_clutch_size = 8,
  litter_size_min = 2, litter_size_max = 24
WHERE id = 'western_hognose';

UPDATE species SET
  incubation_days_min = 58, incubation_days_max = 65,
  avg_clutch_size = 12,
  litter_size_min = 3, litter_size_max = 24
WHERE id = 'corn_snake';

UPDATE species SET
  incubation_days_min = 100, incubation_days_max = 120,
  avg_clutch_size = 20,
  litter_size_min = 10, litter_size_max = 60,
  gives_live_birth = 1
WHERE id = 'boa_constrictor';

UPDATE species SET
  incubation_days_min = 45, incubation_days_max = 65,
  avg_clutch_size = 18,
  litter_size_min = 4, litter_size_max = 36
WHERE id = 'carpet_python';

-- ── Hognose allele groups ─────────────────────────────────────
INSERT OR IGNORE INTO allele_groups (id, species_id, name, description) VALUES
  ('wh_conda_complex', 'western_hognose', 'Conda Complex',
   'Anaconda and related pattern-reducing incomplete dominant alleles. Super = Superconda (near patternless).');
