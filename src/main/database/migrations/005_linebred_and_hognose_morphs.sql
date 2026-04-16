-- ============================================================
-- Migration 005 - Ball Python line-bred + Western Hognose morphs
-- ============================================================

-- ── BALL PYTHON LINE-BRED MORPHS ─────────────────────────────
INSERT OR IGNORE INTO morphs (id, species_id, name, gene_symbol, category, inheritance_type, super_form_name, has_health_concern, health_concern_desc, description, also_known_as, discovered_year, sort_order) VALUES

('bp_jungle',        'ball_python', 'Jungle',           'jun',  'Line-bred', 'line_bred', NULL, 0, NULL, 'Highly variable pattern mutation. Asymmetric, alien-like pattern. Line-bred for generations to intensify expression.', NULL, 1995, 10),
('bp_high_yellow',   'ball_python', 'High Yellow',      'hy',   'Line-bred', 'line_bred', NULL, 0, NULL, 'Selective breeding for intense yellow saturation. Not a single gene but a line-bred trait.', NULL, 1990, 20),
('bp_granite',       'ball_python', 'Granite',          'gra',  'Line-bred', 'line_bred', NULL, 0, NULL, 'Speckled, granite-like pattern. Achieved through selective breeding over many generations.', NULL, 2000, 30),
('bp_jolliff_jungle','ball_python', 'Jolliff Jungle',   'jj',   'Line-bred', 'line_bred', NULL, 0, NULL, 'Specific jungle line bred by the Jolliff family. Highly valued for its dramatic, asymmetric patterning.', NULL, 1996, 40),
('bp_genetic_banded','ball_python', 'Genetic Banded',   'gb',   'Line-bred', 'line_bred', NULL, 0, NULL, 'Wide, clean banding pattern. Selective breeding for uniform, bold banding.', NULL, 1998, 50),
('bp_sunset_linebred','ball_python','Sunset (Line-bred)','sunl', 'Line-bred', 'line_bred', NULL, 0, NULL, 'Line-bred for intense orange-red tones. Some sunset lines may have a recessive component.', NULL, 2008, 55),
('bp_bamboo',        'ball_python', 'Bamboo',           'bam',  'Line-bred', 'line_bred', NULL, 0, NULL, 'Yellowish-green hue with reduced pattern. One of the original line-bred varieties.', NULL, 2003, 60),
('bp_rio',           'ball_python', 'Rio',              'rio',  'Line-bred', 'line_bred', NULL, 0, NULL, 'Pattern-reducing line-bred morph with clean sides. Vibrant colouration.', NULL, 2007, 70),
('bp_stormtrooper',  'ball_python', 'Stormtrooper',     'str2', 'Line-bred', 'line_bred', NULL, 0, NULL, 'Bold black and white pattern with minimal yellow. Dramatic, high-contrast.', NULL, 2011, 80),

-- ── WESTERN HOGNOSE MORPHS ───────────────────────────────────
-- Recessive morphs
('wh_albino',        'western_hognose', 'Albino',       'alb',  'Recessive', 'recessive', NULL, 0, NULL, 'Amelanistic. Removes all dark pigment. Pink/red eyes, yellow and white patterning.', 'Amelanistic', 2003, 10),
('wh_axanthic',      'western_hognose', 'Axanthic',     'ax',   'Recessive', 'recessive', NULL, 0, NULL, 'Removes yellow pigment. Grey, black, and white animals. Can be bred with albino to produce snow.', NULL, 2006, 20),
('wh_toffee',        'western_hognose', 'Toffee',       'tof',  'Recessive', 'recessive', NULL, 0, NULL, 'Warm toffee/caramel coloration with reduced pattern. Similar in appearance to some BP morphs.', NULL, 2007, 30),
('wh_conda',         'western_hognose', 'Conda',        'con',  'Recessive', 'recessive', NULL, 0, NULL, 'Reduces pattern significantly. Animals often show dorsal stripe and clean sides. Highly sought after.', NULL, 2008, 40),
('wh_pink_pastel',   'western_hognose', 'Pink Pastel',  'pp',   'Recessive', 'recessive', NULL, 0, NULL, 'Pink-toned animals with pastel colouration. A variant of the pastel recessive line in hognose.', NULL, 2009, 45),

-- Co-dominant/Dominant
('wh_pastel',        'western_hognose', 'Pastel',       'pst',  'Co-dominant', 'co_dominant', 'Super Pastel', 0, NULL, 'Brightens and enhances yellow and orange tones. Super Pastel is an intensely coloured animal.', NULL, 2005, 50),
('wh_superconda',    'western_hognose', 'Superconda',   'sc',   'Co-dominant', 'co_dominant', 'Superconda', 0, NULL, 'The super form of Conda. Nearly patternless with a faint dorsal stripe. One of the most desired hognose morphs.', NULL, 2010, 55),
('wh_toxic',         'western_hognose', 'Toxic',        'tox',  'Co-dominant', 'co_dominant', 'Super Toxic', 0, NULL, 'Vivid green/yellow-green coloration. Super Toxic is an intensely coloured lime-green animal.', NULL, 2010, 60),
('wh_arctic',        'western_hognose', 'Arctic',       'arc',  'Co-dominant', 'co_dominant', 'Super Arctic', 0, NULL, 'Cool, blue-grey colour reduction. Super Arctic is very pale. Combines with other morphs for icy aesthetics.', NULL, 2009, 70),
('wh_lavender',      'western_hognose', 'Lavender',     'lav',  'Co-dominant', 'co_dominant', 'Super Lavender', 0, NULL, 'Purple-lavender undertones. Super Lavender is a pale, lavender-tinged animal.', NULL, 2011, 80),

-- Combo names
('wh_snow',          'western_hognose', 'Snow',         'snw',  'Recessive', 'recessive', NULL, 0, NULL, 'Combination of Albino + Axanthic. White animals with pink eyes. One of the most popular hognose combos.', 'Blizzard (in some lines)', 2008, 200),
('wh_coral',         'western_hognose', 'Coral',        'cor',  'Recessive', 'recessive', NULL, 0, NULL, 'Combination of Albino + Toffee. Warm coral-pink colouration.', NULL, 2010, 210),
('wh_caramel',       'western_hognose', 'Caramel',      'car',  'Recessive', 'recessive', NULL, 0, NULL, 'Combination of Toffee + Axanthic. Warm caramel-brown animals.', NULL, 2011, 220),

-- Line-bred
('wh_anaconda',      'western_hognose', 'Anaconda',     'ana',  'Line-bred', 'line_bred', NULL, 0, NULL, 'Pattern-reduced hognose. Line-bred to reduce lateral banding. Precursor/related to the Conda gene.', NULL, 2007, 300),
('wh_high_orange',   'western_hognose', 'High Orange',  'ho',   'Line-bred', 'line_bred', NULL, 0, NULL, 'Selective breeding for intense orange coloration. Not a single gene.', NULL, 2005, 310),
('wh_high_red',      'western_hognose', 'High Red',     'hr',   'Line-bred', 'line_bred', NULL, 0, NULL, 'Selective breeding for intense red/orange dorsal colouration.', NULL, 2006, 320);
