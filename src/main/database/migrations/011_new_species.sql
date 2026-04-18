-- ============================================================
-- Migration 011 - New species: Leopard Gecko + Bearded Dragon
-- ============================================================

INSERT OR IGNORE INTO species (
  id, common_name, scientific_name, avg_clutch_size,
  incubation_days_min, incubation_days_max,
  gives_live_birth, litter_size_min, litter_size_max,
  notes
) VALUES
  ('leopard_gecko',   'Leopard Gecko',   'Eublepharis macularius', 2,
   45, 65, 0, 1, 2,
   'Clutch of 2 eggs per cycle, up to 8-10 clutches per season. Popular beginner gecko. Many morphs available including ethical concerns around Enigma and Lemon Frost.'),
  ('bearded_dragon',  'Bearded Dragon',  'Pogona vitticeps',       25,
   55, 75, 0, 10, 35,
   'Clutch of 20-35 eggs. Omnivore. Wide variety of scale and colour morphs. Silkback husbandry requires special care.');
