-- ============================================================
-- Migration 003 - Ball Python morphs (Recessive)
-- ============================================================

-- ── RECESSIVE MORPHS ─────────────────────────────────────────
INSERT OR IGNORE INTO morphs (id, species_id, name, gene_symbol, category, inheritance_type, has_health_concern, health_concern_desc, description, also_known_as, discovered_year, sort_order) VALUES

-- Classic recessives - foundational morphs
('bp_albino',        'ball_python', 'Albino',           'alb',  'Recessive', 'recessive', 0, NULL, 'Eliminates all dark pigment. Yellow and white pattern with red/pink eyes. The first widely produced ball python morph.', 'Amelanistic, Type 1 Albino', 1992, 10),
('bp_axanthic',      'ball_python', 'Axanthic',         'ax',   'Recessive', 'recessive', 0, NULL, 'Eliminates yellow pigment, producing black, grey, and white animals. Multiple unrelated lines exist.', 'Axa', 1997, 20),
('bp_clown',         'ball_python', 'Clown',            'clo',  'Recessive', 'recessive', 0, NULL, 'Reduces pattern significantly. Distinctive banded tail and clear dorsal stripe. Produces clean, high-contrast animals.', NULL, 1999, 30),
('bp_pied',          'ball_python', 'Piebald',          'pie',  'Recessive', 'recessive', 0, NULL, 'White body with coloured patches. Patterning is random and unpredictable. One of the most popular morphs.', 'Pied, Piebald', 1997, 40),
('bp_hypo',          'ball_python', 'Hypo',             'hyp',  'Recessive', 'recessive', 0, NULL, 'Reduces dark pigmentation (hypomelanism). Produces cleaner, lighter animals. Multiple lines exist.', 'Hypomelanism, Ghost', 2002, 50),
('bp_recessive_ghost','ball_python','Ghost',            'gho',  'Recessive', 'recessive', 0, NULL, 'Reduces both dark and yellow pigment. Faded, washed-out appearance. Distinct from Hypo in visual and genetic expression.', NULL, 2001, 55),
('bp_lavender',      'ball_python', 'Lavender Albino',  'lav',  'Recessive', 'recessive', 0, NULL, 'Lavender and yellow coloration with pink eyes. Stunning pastel purple tones. Unrelated to standard albino.', 'Lavender', 2001, 60),
('bp_ultramel',      'ball_python', 'Ultramel',         'um',   'Recessive', 'recessive', 0, NULL, 'Allelic to albino. Visual animals are a warm caramel/brown. Produces normal-looking hets and albino-looking supers when combined with albino.', 'Ultra, Caramel Albino', 2005, 70),
('bp_caramel',       'ball_python', 'Caramel',          'car',  'Recessive', 'recessive', 0, NULL, 'Warm caramel and yellow coloration. Reduces dark pigment. Allelic to some lines. Produces stunning combos with other recessives.', NULL, 2001, 80),
('bp_toffee',        'ball_python', 'Toffee',           'tof',  'Recessive', 'recessive', 0, NULL, 'Similar to caramel but distinct genetic origin. Warm honey-brown tones with reduced pattern.', 'Toffino', 2003, 85),

-- Pattern recessives
('bp_genetic_stripe','ball_python', 'Genetic Stripe',   'str',  'Recessive', 'recessive', 0, NULL, 'Produces a bold dorsal stripe and reduced lateral pattern. Clean, linear appearance. Highly sought after.', 'G-Stripe', 1995, 90),
('bp_spider_recessive','ball_python','Spider (Recessive line)','spr', 'Recessive', 'recessive', 0, NULL, 'Recessive line of spider-pattern animals. Distinct from the co-dominant spider gene. Rare.', NULL, 2010, 95),
('bp_highway',       'ball_python', 'Highway',          'hwy',  'Recessive', 'recessive', 0, NULL, 'Produces a bold lateral stripe or "highway" pattern. Clean and graphic appearance.', NULL, 2007, 100),
('bp_monsoon',       'ball_python', 'Monsoon',          'mon',  'Recessive', 'recessive', 0, NULL, 'Reduces pattern and alters colouration, producing a washed, rain-like appearance.', NULL, 2012, 105),
('bp_leopard',       'ball_python', 'Leopard',          'lep',  'Recessive', 'recessive', 0, NULL, 'Breaks up the normal pattern into a spotty, leopard-like arrangement.', NULL, 2003, 110),
('bp_spotnose_rec',  'ball_python', 'Spotnose (Recessive)','snr','Recessive', 'recessive', 0, NULL, 'Recessive line producing spot-like pattern reduction. Not the same gene as the dominant Spotnose.', NULL, 2009, 115),

-- Colour recessives  
('bp_desert',        'ball_python', 'Desert',           'des',  'Recessive', 'recessive', 0, NULL, 'Reduces dark pigment, creating sandy, desaturated animals. Subtle in isolation, powerful in combos.', 'Desert Ghost', 2002, 120),
('bp_orange_dream_rec','ball_python','Orange Dream (Recessive line)','odr','Recessive','recessive',0,NULL,'Recessive line distinct from the dominant Orange Dream morph. Produces vivid orange animals.', NULL, 2010, 125),
('bp_ivory_rec',     'ball_python', 'Ivory (Recessive)', 'ivr', 'Recessive', 'recessive', 0, NULL, 'Produces white/cream animals with subtle pattern. Not the same as the super Yellow Belly Ivory.', NULL, 2009, 130),
('bp_sable',         'ball_python', 'Sable',            'sbl',  'Recessive', 'recessive', 0, NULL, 'Dark, rich brown coloration with reduced yellow. Produces dramatic combos with pattern morphs.', NULL, 2005, 135),
('bp_black_ivory',   'ball_python', 'Black Ivory',      'biv',  'Recessive', 'recessive', 0, NULL, 'Very dark base animal with reduced pattern. Stunning in combination with colour-reducing morphs.', NULL, 2009, 140),
('bp_sunset',        'ball_python', 'Sunset',           'sun',  'Recessive', 'recessive', 0, NULL, 'Vivid orange-red animals with reduced dark pattern. Dramatic coloration, particularly in combos.', NULL, 2012, 145),
('bp_acid',          'ball_python', 'Acid',             'acd',  'Recessive', 'recessive', 0, NULL, 'Disrupts pattern dramatically, producing irregular, fragmented markings. Bold graphic appearance.', NULL, 2014, 150),
('bp_lace',          'ball_python', 'Lace',             'lac',  'Recessive', 'recessive', 0, NULL, 'Alters pattern to produce intricate, lace-like markings. Subtle but distinctive.', NULL, 2008, 155),
('bp_cryptic',       'ball_python', 'Cryptic',          'cry',  'Recessive', 'recessive', 0, NULL, 'Produces unusual pattern fragmentation and colour shift. Relatively rare.', NULL, 2011, 160),
('bp_spark',         'ball_python', 'Spark',            'spk',  'Recessive', 'recessive', 0, NULL, 'Brightens yellow pigment and reduces pattern. Produces vivid animals, especially in combos.', NULL, 2013, 165),
('bp_confusion',     'ball_python', 'Confusion',        'con',  'Recessive', 'recessive', 0, NULL, 'Fragment and disrupts the normal pattern significantly. Unusual, eye-catching appearance.', NULL, 2012, 170),
('bp_fire_fly',      'ball_python', 'Firefly',          'fly',  'Recessive', 'recessive', 0, NULL, 'A recessive pattern/colour modifier. Brightens and fragments pattern elements.', NULL, 2010, 175),
('bp_protocol',      'ball_python', 'Protocol',         'prc',  'Recessive', 'recessive', 0, NULL, 'Pattern-reducing recessive. Reduces lateral banding and intensifies dorsal pattern.', NULL, 2014, 180),
('bp_russo',         'ball_python', 'Russo',            'rus',  'Recessive', 'recessive', 0, NULL, 'Named after breeder. Colour and pattern modifier producing cleaner, brightened animals.', NULL, 2007, 185),
('bp_wookie',        'ball_python', 'Wookie',           'wok',  'Recessive', 'recessive', 0, NULL, 'Reduces pattern. Produces animals with a distinctive, textured-looking pattern arrangement.', NULL, 2011, 190),

-- Axanthic lines (multiple unrelated genes, all recessive)
('bp_vpi_axanthic',  'ball_python', 'VPI Axanthic',     'vpax', 'Recessive', 'recessive', 0, NULL, 'Original VPI line axanthic. Does not work with other axanthic lines to produce visual axanthics.', 'VPI Ax', 1997, 200),
('bp_rrt_axanthic',  'ball_python', 'RRT Axanthic',     'rrax', 'Recessive', 'recessive', 0, NULL, 'RRC/RRT line axanthic. Separate gene from VPI axanthic.', 'RRC Axanthic', 2001, 205),
('bp_marcus_axanthic','ball_python','Marcus Axanthic',  'max',  'Recessive', 'recessive', 0, NULL, 'Marcus Jayne line axanthic. Third separate axanthic gene.', NULL, 2003, 210),
('bp_tsb_axanthic',  'ball_python', 'TSB Axanthic',     'tsax', 'Recessive', 'recessive', 0, NULL, 'Technically Serpents BV line axanthic. Fourth axanthic gene.', 'Technically Serpents Axanthic', 2005, 215),

-- Albino lines (allelic series)
('bp_type1_albino',  'ball_python', 'Type 1 Albino',    'alb1', 'Recessive', 'recessive', 0, NULL, 'Standard amelanistic albino. The most common and oldest albino line.', 'Standard Albino', 1992, 220),
('bp_caramel_albino','ball_python', 'Caramel Albino',   'calb', 'Recessive', 'recessive', 0, NULL, 'Allelic to standard albino. Warm caramel/honey coloration. Cross-breeding with standard albino produces visual animals.', NULL, 2002, 225),

-- More recent recessives
('bp_microscale',    'ball_python', 'Microscale',       'mic',  'Recessive', 'recessive', 0, NULL, 'Reduces scale size throughout the body. Produces a distinctive rough texture.', NULL, 2015, 230),
('bp_scaleless_head','ball_python', 'Scaleless Head',   'sch',  'Recessive', 'recessive', 0, NULL, 'Removes scales from the head while body remains normally scaled.', NULL, 2013, 235),
('bp_puzzle',        'ball_python', 'Puzzle',           'puz',  'Recessive', 'recessive', 0, NULL, 'Fragments the pattern into puzzle-like pieces. Dramatic pattern disruption.', NULL, 2016, 240),
('bp_mochi',         'ball_python', 'Mochi',            'moc',  'Recessive', 'recessive', 0, NULL, 'Colour and pattern modifier. Brightens yellows and creates clean pattern edges.', NULL, 2016, 245),
('bp_dreamsicle_gene','ball_python','Dreamsicle Gene',  'drm',  'Recessive', 'recessive', 0, NULL, 'Component gene in the Dreamsicle combination. Alters patterning when combined with Piebald and Albino.', NULL, 2010, 250),
('bp_butterfly',     'ball_python', 'Butterfly',        'but',  'Recessive', 'recessive', 0, NULL, 'Creates a distinctive butterfly-shaped dorsal pattern. Eye-catching graphic pattern.', NULL, 2015, 255),
('bp_specter',       'ball_python', 'Specter',          'spc',  'Recessive', 'recessive', 0, NULL, 'Pattern and colour modifier. Fades and fragments the pattern. Produces ghostly-looking animals.', NULL, 2013, 260),
('bp_ringer',        'ball_python', 'Ringer',           'rng',  'Recessive', 'recessive', 0, NULL, 'Produces white ringed patterns around the body. Related to the pied gene series.', NULL, 2008, 265),
('bp_orange_ghost',  'ball_python', 'Orange Ghost',     'ogh',  'Recessive', 'recessive', 0, NULL, 'Produces vivid orange coloration with ghosting effect. Distinct from standard hypo/ghost lines.', NULL, 2009, 270),
('bp_ultrablack',    'ball_python', 'Ultrablack',       'ub',   'Recessive', 'recessive', 0, NULL, 'Increases dark pigmentation dramatically. Produces very dark, near-black animals.', NULL, 2014, 275),
('bp_vanilla',       'ball_python', 'Vanilla',          'van',  'Recessive', 'recessive', 0, NULL, 'Brightens base colouration. Subtle in isolation but enhances colour in combinations.', NULL, 2008, 280),
('bp_sterling',      'ball_python', 'Sterling',         'ste',  'Recessive', 'recessive', 0, NULL, 'Produces clean silver-grey animals with reduced pattern. Beautiful minimal aesthetic.', NULL, 2011, 285),
('bp_tidal',         'ball_python', 'Tidal',            'tid',  'Recessive', 'recessive', 0, NULL, 'Creates flowing, wave-like pattern disruption. Blue-grey tones in the pattern.', NULL, 2014, 290),
('bp_jaguar',        'ball_python', 'Jaguar',           'jag',  'Recessive', 'recessive', 0, NULL, 'Produces spotted, jaguar-like pattern fragmentation. Different gene from Leopard.', NULL, 2012, 295),
('bp_marbled',       'ball_python', 'Marbled',          'mrb',  'Recessive', 'recessive', 0, NULL, 'Creates a marbled, swirled pattern appearance. Unusual and distinctive.', NULL, 2011, 300);
