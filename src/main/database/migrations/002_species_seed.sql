-- ============================================================
-- Migration 002 - Species seed data
-- ============================================================

INSERT OR IGNORE INTO species (id, common_name, scientific_name, avg_clutch_size, incubation_days_min, incubation_days_max, notes) VALUES
  ('ball_python',     'Ball Python',        'Python regius',           6,  54, 60, 'Most popular pet python. Clutch sizes typically 4-10 eggs.'),
  ('western_hognose', 'Western Hognose',    'Heterodon nasicus',       16, 50, 65, 'Rear-fanged colubrid. Larger clutches than pythons. Venom is mild and rear-delivered.'),
  ('corn_snake',      'Corn Snake',         'Pantherophis guttatus',   12, 58, 65, 'Popular beginner colubrid. Prolific breeders.'),
  ('boa_constrictor', 'Boa Constrictor',    'Boa constrictor',         20, 0,  0,  'Live-bearing. Litter sizes vary widely (10-60+). Gestation ~100-120 days.'),
  ('carpet_python',   'Carpet Python',      'Morelia spilota',         18, 45, 65, 'Multiple subspecies. Active and alert.'),
  ('kenyan_sand_boa', 'Kenyan Sand Boa',    'Eryx colubrinus',         15, 0,  0,  'Live-bearing. Popular dwarf boa.'),
  ('blood_python',    'Blood Python',       'Python brongersmai',      12, 70, 80, 'Stocky, humid-habitat python. Beautiful but can be defensive.'),
  ('reticulated_python','Reticulated Python','Malayopython reticulatus',40, 78, 90, 'Largest snake species. Advanced keeper only.'),
  ('blue_tongued_skink','Blue-Tongued Skink','Tiliqua scincoides',     10, 0,  0,  'Live-bearing lizard. Not a snake but popular in same community.'),
  ('crested_gecko',   'Crested Gecko',      'Correlophus ciliatus',    2,  60, 90, 'Arboreal gecko. 2 eggs per clutch, lays multiple clutches per year.');
