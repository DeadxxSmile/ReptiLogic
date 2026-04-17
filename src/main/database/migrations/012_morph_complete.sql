-- ============================================================
-- Migration 012 - Complete morph databases: Hognose overhaul,
--                 Leopard Gecko, Bearded Dragon
-- ============================================================

-- ── WESTERN HOGNOSE: Fix existing incorrect entries ───────────
-- Conda is INCOMPLETE DOMINANT (not recessive)
UPDATE morphs SET
  inheritance_type = 'co_dominant',
  super_form_name  = 'Superconda',
  description      = 'Pattern-reducing incomplete dominant. Single copy (Conda) shows reduced pattern with variable expression. Superconda (homozygous) is near-patternless with a faint dorsal stripe. Most popular pattern morph in western hognose.'
WHERE id = 'wh_conda';

-- Superconda is the super form of Conda, not a standalone morph
-- Remove the incorrect standalone entry and let the system derive it
DELETE FROM morphs WHERE id = 'wh_superconda';

-- Fix Toffee — it is Toffee Belly (incomplete dominant, not recessive)
UPDATE morphs SET
  name             = 'Toffee Belly',
  inheritance_type = 'co_dominant',
  super_form_name  = 'Super Toffee Belly',
  description      = 'Incomplete dominant. Replaces the normal black-and-white checkered belly with a golden-amber/toffee coloration. Single copy (Toffee Belly) shows modified ventral pattern; super shows intensified toffee coloration throughout.'
WHERE id = 'wh_toffee';

-- Arctic is INCOMPLETE DOMINANT (already correct) — update description
UPDATE morphs SET
  description = 'Incomplete dominant. Cool silver-grey coloration reducing warm pigments. Super Arctic (homozygous) produces a striking black-and-white patterned animal — dramatically different from the single copy.'
WHERE id = 'wh_arctic';

-- Fix Pastel — hognose Pastel (RBE) is DOMINANT, not co-dominant
UPDATE morphs SET
  inheritance_type = 'dominant',
  super_form_name  = 'Super Pastel (RBE)',
  description      = 'Dominant gene. Brightens and enhances colours. Also known as RBE (Red Back Eyed) Pastel. Expressed from a single copy; super form has intensified expression.'
WHERE id = 'wh_pastel';

-- Lavender: recessive in hognose, not co-dominant
UPDATE morphs SET
  inheritance_type = 'recessive',
  super_form_name  = NULL,
  description      = 'Recessive. Produces light lavender-pink to silver coloration with dark eyes. A hypomelanistic-type mutation distinct from albino. Combines with albino for stunning results.'
WHERE id = 'wh_lavender';

-- Fix Pink Pastel (PPA)
UPDATE morphs SET
  name             = 'Pink Pastel Albino',
  gene_symbol      = 'ppa',
  has_health_concern = 1,
  health_concern_desc = 'Known health issues in some lines including spinal kinks, stargazing, enlarged heads, dwarfism, and eye abnormalities. Modern breeders have improved the line through outcrossing but health should be monitored.',
  description      = 'Recessive. A T- albino variant producing intense pink coloration. Distinct gene from standard albino — the two are NOT allelic. Historically had health issues but modern lines are improved. Also called PPA.'
WHERE id = 'wh_pink_pastel';

-- Albino: add health note (light sensitivity)
UPDATE morphs SET
  has_health_concern  = 1,
  health_concern_desc = 'Light sensitivity (photophobia) due to lack of melanin in eyes. Avoid bright direct lighting.'
WHERE id = 'wh_albino';

-- Fix Toxic — is a line-bred/selective trait, not co-dominant
UPDATE morphs SET
  inheritance_type = 'line_bred',
  super_form_name  = NULL,
  description      = 'Line-bred for vivid yellow-green to olive coloration. Not a proven single-gene mutation — achieved through selective breeding. Expression varies.'
WHERE id = 'wh_toxic';

-- ── WESTERN HOGNOSE: Add missing morphs ───────────────────────
INSERT OR IGNORE INTO morphs (
  id, species_id, name, gene_symbol, category, inheritance_type,
  super_form_name, has_health_concern, health_concern_desc,
  description, also_known_as, discovered_year, sort_order
) VALUES

-- Recessives
('wh_sable',         'western_hognose', 'Sable',              'sab', 'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Increases melanin production creating a dark brown, desaturated animal with reduced pattern contrast. Homozygous sables are richly dark brown.', NULL, 2008, 25),

('wh_evans_hypo',    'western_hognose', 'Evans Hypo',         'evh', 'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive hypomelanistic. Reduces but does not eliminate dark pigment. Animals are brighter with lighter, cleaner saddle marks and dark eyes. The "Evans" designation distinguishes this line.', 'Hypo', 2006, 27),

('wh_caramel_albino','western_hognose', 'Caramel Albino',     'car', 'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive T+ albino. Cannot produce melanin but retains melanin-related pigments. Result is warm peach-caramel tones with variable expression. More variable in appearance than T- albino.', 'T+ Albino', 2007, 35),

('wh_pistachio',     'western_hognose', 'Pistachio',          'pis', 'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Produces a pale green to yellow-green coloration. The dark belly pattern is replaced with lavender/purple. A striking and relatively rare recessive mutation.', NULL, 2014, 37),

('wh_leucistic',     'western_hognose', 'Leucistic',          'leu', 'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Pure white animals as adults. Hatchlings start with a pink hue that fades to white. Considered the holy grail of western hognose morphs. Requires specific double recessive combination to produce.', 'White', 2012, 38),

-- Incomplete dominant
('wh_anaconda',      'western_hognose', 'Anaconda',           'ana', 'Co-dominant', 'co_dominant', 'Superconda', 0, NULL,
 'Incomplete dominant. Single copy (Anaconda/Conda) shows reduced lateral pattern with variable expressivity. Homozygous (Superconda) is near-patternless. Most widely used pattern gene in hognose breeding.', 'Conda', 2007, 40),

-- Line-bred
('wh_extreme_red',   'western_hognose', 'Extreme Red',        'er',  'Line-bred', 'line_bred', NULL, 0, NULL,
 'Polygenic/line-bred. Selectively bred for intense red/orange dorsal colouration over many generations.', NULL, 2005, 310),

('wh_diablo',        'western_hognose', 'Diablo',             'dbl', 'Line-bred', 'line_bred', NULL, 0, NULL,
 'Line-bred. Affects eye colouration — one or both eyes turn solid black. Non-genetic in most cases but can appear heritable in certain lines.', 'Black Eye', 2009, 315),

('wh_raging_red',    'western_hognose', 'Raging Red',         'rr',  'Line-bred', 'line_bred', NULL, 0, NULL,
 'Advanced extreme red line-bred. Intensified red/orange saturation beyond standard extreme red.', NULL, 2010, 320),

('wh_lemon_ghost',   'western_hognose', 'Lemon Ghost',        'lg',  'Line-bred', 'line_bred', NULL, 0, NULL,
 'Line-bred yellow morph with faded patterning. Likely involves Caramel Albino and Evans Hypo in its expression but exact genetics vary by line.', NULL, 2011, 325);

-- ── WESTERN HOGNOSE: Allele groups ───────────────────────────
-- Albino and PPA are NOT allelic — keep separate
-- Anaconda and wh_conda are the same gene (rename/dedup handled by UPDATE above)

-- ── LEOPARD GECKO: Full morph database ───────────────────────
INSERT OR IGNORE INTO morphs (
  id, species_id, name, gene_symbol, category, inheritance_type,
  super_form_name, has_health_concern, health_concern_desc,
  description, also_known_as, discovered_year, sort_order
) VALUES

-- ── Recessive ──────────────────────────────────────────────────
('lg_tremper_albino', 'leopard_gecko', 'Albino (Tremper)',    'tr',  'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. The original and most common albino line. Produces animals with yellow/orange colouration and pink/red eyes. NOT allelic with Bell or Rainwater albino — crosses between strains produce normal-looking animals carrying both recessives.',
 'Texas Albino, Tremper', 1996, 10),

('lg_bell_albino',    'leopard_gecko', 'Albino (Bell)',       'bl',  'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Separate albino mutation from the Bell line. Pinkish/lavender hue and distinctive pink eyes at all ages. NOT allelic with Tremper or Rainwater — crossing strains produces normal hets.',
 'Florida Albino, Bell', 2004, 11),

('lg_rainwater_albino','leopard_gecko','Albino (Rainwater)',  'rw',  'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. The lightest of the three albino strains. Produces small, light-coloured animals with pink/red eyes. NOT allelic with Tremper or Bell. Also called Las Vegas Albino.',
 'Las Vegas Albino', 2002, 12),

('lg_eclipse',        'leopard_gecko', 'Eclipse',            'ec',  'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Causes solid black or clear "snake eyes" and white markings on nose, feet, and tail. High-expression animals can have all-black eyes. Used in many combo morphs including RAPTOR.',
 'Snake Eyes', 2004, 20),

('lg_blizzard',       'leopard_gecko', 'Blizzard',           'blz', 'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Produces uniformly light/white animals with no visible pattern as adults. Hatchlings are pale from birth unlike Murphy Patternless. Eyes are typically dark.',
 NULL, 1995, 30),

('lg_murphy_patternless','leopard_gecko','Murphy Patternless','mp',  'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Animals hatch with a dramatic jungle-like pattern that fades completely with age into a patternless animal. Distinct from Blizzard in hatchling appearance. Eyes remain dark.',
 'Patternless', 1991, 40),

('lg_raining_red',    'leopard_gecko', 'Raining Red Eyes',   'rre', 'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Produces ruby red eyes in otherwise normal-appearing animals. Distinct gene from Eclipse. Relatively rare in the hobby.',
 'Red Eye', 2005, 50),

('lg_marble_eye',     'leopard_gecko', 'Marble Eye',         'me',  'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Creates a marbled or mottled eye appearance distinct from solid Eclipse eyes. Sometimes confused with Eclipse but genetically separate.',
 NULL, 2003, 55),

-- ── Incomplete dominant ─────────────────────────────────────────
('lg_mack_snow',      'leopard_gecko', 'Mack Snow',          'ms',  'Co-dominant', 'co_dominant', 'Super Snow', 0, NULL,
 'Incomplete dominant. Single copy (Mack Snow) shows reduced yellow pigmentation with white and black banding as hatchlings that softens with age. Homozygous (Super Snow) is a striking nearly-white animal with black markings.',
 'Snow', 2006, 60),

('lg_giant',          'leopard_gecko', 'Giant',              'gi',  'Co-dominant', 'co_dominant', 'Super Giant', 0, NULL,
 'Incomplete dominant affecting body size. Single copy (Giant) produces animals 10-20% larger than standard. Homozygous (Super Giant) can reach 120-150g — nearly double normal adult weight.',
 NULL, 2000, 70),

-- ── Dominant ────────────────────────────────────────────────────
('lg_white_and_yellow','leopard_gecko','White & Yellow',      'wy',  'Dominant', 'dominant', 'Super White & Yellow', 0, NULL,
 'Dominant. Enhances yellow/white colouration and reduces or eliminates spotting on the sides. Super form is a cleaner, brighter version.',
 'W&Y', 2007, 80),

('lg_enigma',         'leopard_gecko', 'Enigma',             'en',  'Dominant', 'dominant', NULL, 1,
 'Neurological disorder: Enigma Syndrome causes circling, star-gazing, balance issues, and seizures. Severity worsens with age and stress. Ethical concerns — many breeders avoid producing Enigma offspring.',
 'Dominant. Produces extreme colouration enhancement and reduced pattern. Highly desirable visually BUT causes Enigma Syndrome — a progressive neurological disorder. Super form is thought to be lethal.',
 NULL, 2006, 85),

('lg_lemon_frost',    'leopard_gecko', 'Lemon Frost',        'lf',  'Dominant', 'dominant', NULL, 1,
 'Associated with iridophoroma — a cancerous tumour condition affecting iridophores (pigment cells). Tumours develop in many individuals, often requiring surgery. Ethical concerns — many breeders avoid producing Lemon Frost offspring.',
 'Dominant. Produces extreme pale lemon-yellow colouration. Visually stunning but associated with cancerous growths (iridophoroma).',
 'Lemon', 2015, 86),

('lg_genetic_stripe', 'leopard_gecko', 'Genetic Stripe',     'gs',  'Dominant', 'dominant', NULL, 0, NULL,
 'Dominant. Produces a bold dorsal stripe from neck to tail with reduced lateral pattern. The stripe is non-pigmented. Super form shows intensified striping.',
 'G-Stripe', 2004, 90),

-- ── Line-bred ───────────────────────────────────────────────────
('lg_tangerine',      'leopard_gecko', 'Tangerine',          'tan', 'Line-bred', 'line_bred', NULL, 0, NULL,
 'Polygenic/line-bred. Selectively bred for intense orange colouration. Expression ranges from light orange to deep carrot. Improves over generations with selective pairing.',
 'Tang', 1995, 100),

('lg_hyper_xanthic',  'leopard_gecko', 'Hyper Xanthic',      'hx',  'Line-bred', 'line_bred', NULL, 0, NULL,
 'Polygenic. Intense yellow colouration throughout the body. Achieved through selective breeding rather than a single gene mutation.',
 NULL, 1999, 110),

('lg_lavender',       'leopard_gecko', 'Lavender',           'lav', 'Line-bred', 'line_bred', NULL, 0, NULL,
 'Polygenic/line-bred. Faint purple to lavender hue overlaid on normal colouration. Breeding consistency varies by line.',
 NULL, 2003, 120);

-- ── LEOPARD GECKO: Albino allele groups ──────────────────────
-- Important: the 3 albino strains are NOT allelic with each other.
-- Crossing them produces normal-looking animals that carry BOTH recessives.
-- We note this in descriptions — no allele_group needed since they DON'T combine.

-- ── BEARDED DRAGON: Full morph database ──────────────────────
INSERT OR IGNORE INTO morphs (
  id, species_id, name, gene_symbol, category, inheritance_type,
  super_form_name, has_health_concern, health_concern_desc,
  description, also_known_as, discovered_year, sort_order
) VALUES

-- ── Recessive ──────────────────────────────────────────────────
('bd_hypo',          'bearded_dragon', 'Hypomelanistic',     'hyp', 'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Reduces dark (melanin) pigmentation producing lighter, brighter colouration with clear/pale nails. One of the most common mutations — present in the majority of captive fancy bearded dragons. Does not alter pattern structure.',
 'Hypo', 2002, 10),

('bd_trans',         'bearded_dragon', 'Translucent',        'tr',  'Recessive', 'recessive', NULL, 1,
 'Some concerns around organ visibility and potential structural fragility. Juvenile blue belly appearance typically fades with age.',
 'Recessive. Reduces scale opacity making juveniles appear translucent with visible internal structure. Dark/black eyes common. Blue belly visible in juveniles. Skin thickens with age reducing transparency.',
 'Trans', 2003, 20),

('bd_zero',          'bearded_dragon', 'Zero',               'zer', 'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Removes both pattern AND most pigmentation. The most extreme patternless mutation. Produces silver-white to pale grey animals. Particularly striking when combined with Hypo (near-white).',
 NULL, 2006, 30),

('bd_witblits',      'bearded_dragon', 'Witblits',           'wb',  'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Patternless mutation that retains colour. Unlike Zero it produces patternless animals with earthy/muted colouration. Non-allelic with Zero — test breeding confirms separate loci.',
 'Wits', 2009, 40),

('bd_silverback',    'bearded_dragon', 'Silverback',         'sv',  'Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Animals hatch with normal patterning that gradually fades with each shed, eventually producing a patternless or near-patternless adult.',
 NULL, 2012, 50),

('bd_american_smoothie','bearded_dragon','American Smoothie', 'asm','Recessive', 'recessive', NULL, 0, NULL,
 'Recessive. Produces reduced/absent dorsal spines similar in appearance to the co-dominant Italian Leatherback. However, the gene is recessive unlike the co-dominant Leatherback mutation. Cannot produce Silkback.',
 'Smoothie', 2010, 55),

-- ── Co-dominant / Incomplete dominant ──────────────────────────
('bd_leatherback',   'bearded_dragon', 'Leatherback',        'lb',  'Co-dominant', 'co_dominant', 'Silkback', 1,
 'Silkback (homozygous Leatherback) has no scales, requiring specialised husbandry to prevent abrasion injuries, dysecdysis, and dehydration. Many keepers consider Silkback production unethical.',
 'Incomplete dominant. Single copy (Leatherback) reduces dorsal spines to a smooth-backed appearance while retaining lateral and head spines. Homozygous (Silkback) has no scales at all.',
 'Italian Leatherback, Smooth', 2002, 60),

-- ── Dominant ────────────────────────────────────────────────────
('bd_dunner',        'bearded_dragon', 'Dunner',             'dun', 'Dominant', 'dominant', NULL, 0, NULL,
 'Dominant. Scales point in irregular directions rather than uniformly. Creates a distinctive textured, rough appearance. Pattern is also modified — dots/spots replace normal striping. No super form; breeding two Dunners does NOT produce a more extreme animal.',
 NULL, 2009, 70),

('bd_genetic_stripe','bearded_dragon', 'Genetic Stripe',     'gst', 'Dominant', 'dominant', NULL, 0, NULL,
 'Dominant. Produces a bold non-pigmented dorsal stripe running from neck to tail. One of the few confirmed dominant pattern mutations in bearded dragons.',
 'G-Stripe', 2005, 80),

-- ── Line-bred ───────────────────────────────────────────────────
('bd_citrus',        'bearded_dragon', 'Citrus',             'cit', 'Line-bred', 'line_bred', NULL, 0, NULL,
 'Polygenic/line-bred. Intense yellow-citrus colouration across the body. Achieved through generations of selective breeding rather than a single gene.',
 NULL, 2003, 100),

('bd_red',           'bearded_dragon', 'Red',                'red', 'Line-bred', 'line_bred', NULL, 0, NULL,
 'Polygenic/line-bred. Deep red to blood-red colouration. One of the most sought-after colour lines.',
 'Blood Red', 2001, 110),

('bd_orange',        'bearded_dragon', 'Orange',             'org', 'Line-bred', 'line_bred', NULL, 0, NULL,
 'Polygenic/line-bred. Rich orange colouration. A foundation colour morph used in many breeding programmes.',
 NULL, 2000, 120),

('bd_yellow',        'bearded_dragon', 'Yellow',             'yel', 'Line-bred', 'line_bred', NULL, 0, NULL,
 'Polygenic/line-bred. Vivid yellow colouration. A classic colour variant established through selective breeding.',
 NULL, 2000, 130),

('bd_paradox',       'bearded_dragon', 'Paradox',            'par', 'Line-bred', 'line_bred', NULL, 0, NULL,
 'Non-genetic or very poorly understood. Produces random patches of unexpected colour or pattern on an otherwise normal or colour morph animal. Cannot be reliably reproduced.',
 NULL, 2008, 140);

-- ── BEARDED DRAGON: Allele groups ────────────────────────────
INSERT OR IGNORE INTO allele_groups (id, species_id, name, description) VALUES
  ('bd_scale_complex', 'bearded_dragon', 'Scale Complex',
   'Leatherback (co-dominant Italian) × American Smoothie (recessive) = Microscale. The two leatherback-type genes interact to produce a third phenotype with minimal spines on body and beard.');

-- Note the Microscale interaction between the two leatherback types
UPDATE morphs SET
  allele_group_id    = 'bd_scale_complex',
  cross_allele_result = 'Microscale'
WHERE id IN ('bd_leatherback', 'bd_american_smoothie');
