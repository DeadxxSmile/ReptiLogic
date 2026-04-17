/**
 * ReptiLogic — Genetics Calculator Engine v2
 *
 * Handles:
 *   - Recessive genes (standard Mendelian)
 *   - Co-dominant / Incomplete dominant genes (single copy visual, super form)
 *   - Dominant genes (one copy visual, super often lethal)
 *   - Allelic gene complexes (e.g. BEL complex — Lesser × Mojave = BEL)
 *   - Multi-gene cartesian product for full clutch outcome table
 *   - Clutch size projections
 */

'use strict'

// ── Single-gene cross functions ──────────────────────────────────────────────

function recessiveCross(exprA, exprB) {
  const alleles = {
    normal:       ['n', 'n'],
    het:          ['n', 'h'],
    visual:       ['h', 'h'],
    possible_het: ['n', 'h'],
    proven_het:   ['n', 'h'],
    super:        ['h', 'h'],
  }
  const a = alleles[exprA] || ['n','n']
  const b = alleles[exprB] || ['n','n']
  const counts = { nn: 0, nh: 0, hh: 0 }
  for (const ai of a) for (const bi of b) {
    const k = [ai,bi].sort().join('')
    counts[k === 'hn' ? 'nh' : k]++
  }
  const r = []
  if (counts.nn) r.push({ genotype:'normal',  label:'Normal',  probability: counts.nn/4 })
  if (counts.nh) r.push({ genotype:'het',     label:'Het',     probability: counts.nh/4 })
  if (counts.hh) r.push({ genotype:'visual',  label:'Visual',  probability: counts.hh/4 })
  return r
}

function coDominantCross(exprA, exprB, superFormName) {
  // Map: 'visual' = single copy for co-doms
  const alleles = {
    normal: ['n','n'],
    single: ['n','+'],
    visual: ['n','+'],
    super:  ['+','+'],
    het:    ['n','n'],
  }
  const a = alleles[exprA] || ['n','n']
  const b = alleles[exprB] || ['n','n']
  const counts = { nn:0, 'n+':0, '++':0 }
  for (const ai of a) for (const bi of b) {
    const k = [ai,bi].sort().join('')
    counts[k === '+n' ? 'n+' : k]++
  }
  const r = []
  if (counts.nn)   r.push({ genotype:'normal', label:'Normal',                          probability: counts.nn/4 })
  if (counts['n+']) r.push({ genotype:'single', label:'Single copy',                     probability: counts['n+']/4 })
  if (counts['++']) r.push({ genotype:'super',  label: superFormName || 'Super / Homozygous', probability: counts['++']/4 })
  return r
}

function dominantCross(exprA, exprB, superFormName) {
  return coDominantCross(exprA, exprB, superFormName)
}

function linebredEstimate(exprA, exprB) {
  const aVis = exprA === 'visual' || exprA === 'single'
  const bVis = exprB === 'visual' || exprB === 'single'
  if (aVis && bVis) return [
    { genotype:'visual', label:'Expresses trait',      probability:0.75 },
    { genotype:'normal', label:'Normal / non-express', probability:0.25 },
  ]
  if (aVis || bVis) return [
    { genotype:'visual', label:'Expresses trait',      probability:0.25 },
    { genotype:'normal', label:'Normal / non-express', probability:0.75 },
  ]
  return [{ genotype:'normal', label:'Normal', probability:1.0 }]
}

// ── Allele-group (complex) cross ─────────────────────────────────────────────
//
// When two DIFFERENT alleles from the same complex are crossed, the offspring
// can receive one of each. This is NOT a super — it's a cross-allele combination
// (e.g. Lesser × Mojave offspring = BEL).
//
// Parent genotypes for allele-group morphs:
//   'normal'  — nn (no copies of any allele in this group)
//   'single'  — n+ (one copy of morph X)
//   'super'   — ++ (two copies of morph X → super of X)
//
// When two different alleles share a group, we track which alleles each parent
// carries and produce the correct cross-allele outcomes.

function allelicGroupCross(parentA, parentB) {
  // parentA / parentB: { alleleId, alleleName, genotype, superFormName, crossAlleleName }
  // genotype: 'normal' | 'single' | 'super'
  //
  // Returns array of { alleles: [a,b], probability, label, isBel, isSuper }
  // alleles = the two allele IDs present (null = wild-type)

  const aAlleles = genotypeToAlleles(parentA)
  const bAlleles = genotypeToAlleles(parentB)

  const outcomes = []
  for (const a of aAlleles) for (const b of bAlleles) {
    outcomes.push([a, b])
  }

  // Count unique combinations
  const counts = {}
  for (const [a,b] of outcomes) {
    const key = [a,b].sort().join('|')
    counts[key] = (counts[key] || 0) + 1
  }

  const result = []
  for (const [key, count] of Object.entries(counts)) {
    const [a, b] = key.split('|')
    result.push({
      alleleA:     a === 'null' ? null : a,
      alleleB:     b === 'null' ? null : b,
      probability: count / 4,
    })
  }
  return result
}

function genotypeToAlleles(parent) {
  // Returns two allele slots (null = wild-type)
  if (!parent || parent.genotype === 'normal') return [null, null]
  if (parent.genotype === 'super') return [parent.alleleId, parent.alleleId]
  return [parent.alleleId, null] // single copy
}

// ── Normalise expression string ──────────────────────────────────────────────

function normaliseExpression(expression, inheritanceType) {
  if (inheritanceType === 'co_dominant' || inheritanceType === 'dominant' || inheritanceType === 'sex_linked') {
    if (expression === 'visual' || expression === 'single') return 'single'
    if (expression === 'super') return 'super'
    return 'normal'
  }
  if (expression === 'super') return 'visual'
  return expression || 'normal'
}

// ── Main calculator ──────────────────────────────────────────────────────────

function calculateOffspring(maleGenes, femaleGenes) {
  if (!maleGenes.length && !femaleGenes.length) {
    return {
      outcomes: [{ genes:[], probability:1.0, label:'Normal', description:'100% Normal', hasHealthConcern:false }],
      geneOutcomes: {},
      healthWarnings: [],
      summary: { totalOutcomes:1, morphPercent:0, normalPercent:100, uniqueVisuals:0 },
    }
  }

  // ── Separate allele-group genes from independent genes ────────────────────
  // Allele-group genes sharing a group must be handled as a unit
  const allMorphIds = new Set([...maleGenes.map(g=>g.morphId), ...femaleGenes.map(g=>g.morphId)])

  // Group morphs by allele_group_id
  const allelicGroups = {}   // groupId → { maleMorphs[], femaleMorphs[] }
  const independentGenes = []

  for (const morphId of allMorphIds) {
    const male   = maleGenes.find(g => g.morphId === morphId)
    const female = femaleGenes.find(g => g.morphId === morphId)
    const gene   = male || female
    const groupId = gene.alleleGroupId

    if (groupId) {
      if (!allelicGroups[groupId]) allelicGroups[groupId] = { groupId, groupName: gene.crossAlleleResult || 'Cross-allele', members: [] }
      allelicGroups[groupId].members.push({ morphId, male, female, gene })
    } else {
      independentGenes.push({ morphId, male, female, gene })
    }
  }

  // ── Process independent genes → single-gene outcomes ─────────────────────
  const independentOutcomes = {}
  for (const { morphId, male, female, gene } of independentGenes) {
    const mExpr = male   ? normaliseExpression(male.expression,   gene.inheritanceType) : 'normal'
    const fExpr = female ? normaliseExpression(female.expression, gene.inheritanceType) : 'normal'
    let outcomes
    if (gene.inheritanceType === 'recessive') {
      outcomes = recessiveCross(mExpr, fExpr)
    } else if (gene.inheritanceType === 'sex_linked') {
      const maleMakerType = male ? (male.makerType || null) : null
      outcomes = sexLinkedCross(mExpr, fExpr, maleMakerType, gene.superFormName)
    } else if (gene.inheritanceType === 'co_dominant') {
      outcomes = coDominantCross(mExpr, fExpr, gene.superFormName)
    } else if (gene.inheritanceType === 'dominant') {
      outcomes = dominantCross(mExpr, fExpr, gene.superFormName)
    } else {
      outcomes = linebredEstimate(mExpr, fExpr)
    }
    independentOutcomes[morphId] = {
      ...gene,
      morphId,
      morphName: gene.morphName,
      singleGeneOutcomes: outcomes,
      isAllelic: false,
    }
  }

  // ── Process allele-group genes → complex outcomes ─────────────────────────
  const allelicOutcomes = {}
  for (const [groupId, group] of Object.entries(allelicGroups)) {
    // Get all alleles each parent carries in this group
    const maleAlleles   = buildParentAlleles(group.members, 'male')
    const femaleAlleles = buildParentAlleles(group.members, 'female')
    const crossResult   = computeAllelicGroupOutcomes(maleAlleles, femaleAlleles, group.members)
    allelicOutcomes[groupId] = { groupId, groupName: group.groupName, outcomes: crossResult, isAllelic: true }
  }

  // ── Cartesian product ─────────────────────────────────────────────────────
  const allOutcomeSets = [
    ...Object.values(independentOutcomes),
    ...Object.values(allelicOutcomes),
  ]

  if (allOutcomeSets.length === 0) {
    return {
      outcomes: [{ genes:[], probability:1.0, label:'Normal', description:'100% Normal', hasHealthConcern:false }],
      geneOutcomes: {},
      healthWarnings: [],
      summary: { totalOutcomes:1, morphPercent:0, normalPercent:100, uniqueVisuals:0 },
    }
  }

  let combinations = [{ parts:[], probability:1.0 }]

  for (const outcomeSet of allOutcomeSets) {
    const newCombos = []
    const setOutcomes = outcomeSet.isAllelic ? outcomeSet.outcomes : outcomeSet.singleGeneOutcomes

    for (const existing of combinations) {
      for (const outcome of setOutcomes) {
        newCombos.push({
          parts: [...existing.parts, { outcomeSet, outcome }],
          probability: existing.probability * outcome.probability,
        })
      }
    }
    combinations = newCombos
  }

  // ── Build labelled result objects ─────────────────────────────────────────
  const resultOutcomes = combinations.map(combo => {
    return buildOutcomeFromParts(combo.parts, combo.probability)
  })

  // Merge identical labels
  const merged = mergeOutcomes(resultOutcomes)
  merged.sort((a,b) => b.probability - a.probability)

  // Health warnings
  const healthWarnings = collectHealthWarnings([...maleGenes, ...femaleGenes])

  return {
    outcomes:      merged,
    geneOutcomes:  independentOutcomes,
    healthWarnings,
    summary:       buildSummary(merged),
  }
}

// ── Allele-group helpers ─────────────────────────────────────────────────────

function buildParentAlleles(members, sex) {
  // Returns array of up to 2 allele slots for this parent
  // [{alleleId, alleleName, morphData}] length <= 2
  const alleles = []
  for (const { morphId, male, female, gene } of members) {
    const parent = sex === 'male' ? male : female
    if (!parent) continue
    const expr = normaliseExpression(parent.expression, gene.inheritanceType)
    if (expr === 'super') {
      alleles.push({ alleleId: morphId, alleleName: gene.morphName, gene })
      alleles.push({ alleleId: morphId, alleleName: gene.morphName, gene })
    } else if (expr === 'single' || expr === 'visual') {
      alleles.push({ alleleId: morphId, alleleName: gene.morphName, gene })
    }
    // normal = no allele pushed
  }
  // Pad with wild-type nulls up to 2
  while (alleles.length < 2) alleles.push(null)
  return alleles.slice(0, 2)
}

function computeAllelicGroupOutcomes(maleAlleles, femaleAlleles, members) {
  // Each parent contributes one of their two allele slots to offspring
  const offspring = []
  for (const ma of maleAlleles) for (const fa of femaleAlleles) {
    offspring.push([ma, fa])
  }

  // Count unique combinations
  const counts = {}
  for (const [a, b] of offspring) {
    const key = buildAllelePairKey(a, b)
    counts[key] = { alleles:[a,b], count: (counts[key]?.count || 0) + 1 }
  }

  // Build probability outcomes
  const result = []
  for (const { alleles: [a,b], count } of Object.values(counts)) {
    result.push({
      alleleA: a,
      alleleB: b,
      probability: count / 4,
      // Label is built later in buildOutcomeFromParts
    })
  }
  return result
}

function buildAllelePairKey(a, b) {
  const ai = a?.alleleId || 'wt'
  const bi = b?.alleleId || 'wt'
  return [ai,bi].sort().join('|')
}

// ── Outcome labelling ────────────────────────────────────────────────────────

function buildOutcomeFromParts(parts, probability) {
  const visualMorphs   = []  // morph names that are visually expressed
  const superMorphs    = []  // super/homozygous form names
  const hetMorphs      = []  // het carriers
  const complexResults = []  // cross-allele combo names (BEL etc.)
  let hasHealthConcern = false
  let healthDetails    = []

  for (const { outcomeSet, outcome } of parts) {
    if (outcomeSet.isAllelic) {
      // Allelic group outcome
      const { alleleA, alleleB } = outcome
      const aId = alleleA?.alleleId
      const bId = alleleB?.alleleId

      if (!aId && !bId) {
        // Normal (no alleles)
      } else if (!aId || !bId) {
        // Single allele — visual of that morph
        const allele = alleleA || alleleB
        visualMorphs.push(allele.alleleName)
        if (allele.gene?.hasHealthConcern) { hasHealthConcern = true; healthDetails.push(allele.gene.healthConcernDesc) }
      } else if (aId === bId) {
        // Same allele twice — super form
        const allele = alleleA
        const superName = allele.gene?.superFormName || `Super ${allele.alleleName}`
        superMorphs.push(superName)
        if (allele.gene?.hasHealthConcern) { hasHealthConcern = true; healthDetails.push(allele.gene.healthConcernDesc) }
      } else {
        // Two DIFFERENT alleles from same group → cross-allele result (BEL!)
        const crossName = alleleA.gene?.crossAlleleResult || alleleB.gene?.crossAlleleResult || `${alleleA.alleleName}/${alleleB.alleleName}`
        complexResults.push(crossName)
        if (alleleA.gene?.hasHealthConcern) { hasHealthConcern = true; healthDetails.push(alleleA.gene.healthConcernDesc) }
        if (alleleB.gene?.hasHealthConcern) { hasHealthConcern = true; healthDetails.push(alleleB.gene.healthConcernDesc) }
      }
    } else {
      // Independent gene outcome
      const { genotype } = outcome
      const gene = outcomeSet
      if (genotype === 'visual' || genotype === 'single') {
        visualMorphs.push(gene.morphName)
        if (gene.hasHealthConcern) { hasHealthConcern = true; healthDetails.push(gene.healthConcernDesc) }
      } else if (genotype === 'super') {
        superMorphs.push(gene.superFormName || `Super ${gene.morphName}`)
        if (gene.hasHealthConcern) { hasHealthConcern = true; healthDetails.push(gene.healthConcernDesc) }
      } else if (genotype === 'het') {
        hetMorphs.push(gene.morphName)
      }
    }
  }

  // Collect sex ratio notes from sex-linked outcomes
  const sexNotes = []
  for (const { outcome } of parts) {
    if (outcome.isSexLinked && outcome.sexNote) {
      sexNotes.push(outcome.sexNote)
    }
  }

  // Build display label
  const labelParts = [...complexResults, ...superMorphs, ...visualMorphs]
  if (hetMorphs.length > 0) {
    labelParts.push(...hetMorphs.map(n => `Het ${n}`))
  }
  const label = labelParts.length > 0 ? labelParts.join(' ') : 'Normal'

  return {
    genes:           parts.map(p => p.outcome),
    probability,
    label,
    description:     `${(probability*100).toFixed(1)}% ${label}`,
    hasHealthConcern,
    healthDetails:   [...new Set(healthDetails.filter(Boolean))],
    sexNote:         sexNotes.length > 0 ? [...new Set(sexNotes)].join('; ') : null,
    isComplex:       complexResults.length > 0,
    isSuperForm:     superMorphs.length > 0,
    isNormal:        label === 'Normal',
  }
}

function mergeOutcomes(outcomes) {
  const map = new Map()
  for (const o of outcomes) {
    const existing = map.get(o.label)
    if (existing) {
      existing.probability += o.probability
    } else {
      map.set(o.label, { ...o })
    }
  }
  return [...map.values()]
}

function collectHealthWarnings(allGenes) {
  const seen = new Set()
  const warnings = []
  for (const g of allGenes) {
    if (g.hasHealthConcern && !seen.has(g.morphId)) {
      seen.add(g.morphId)
      warnings.push({ morphName: g.morphName, description: g.healthConcernDesc })
    }
  }
  return warnings
}

function buildSummary(outcomes) {
  const normalPct = outcomes
    .filter(o => o.label === 'Normal')
    .reduce((sum, o) => sum + o.probability, 0) * 100

  const morphPct = 100 - normalPct

  const visuals = outcomes.filter(o => !o.isNormal)

  return {
    totalOutcomes:  outcomes.length,
    morphPercent:   parseFloat(morphPct.toFixed(1)),
    normalPercent:  parseFloat(normalPct.toFixed(1)),
    uniqueVisuals:  visuals.length,
  }
}

// ── Clutch size projection ────────────────────────────────────────────────────

function projectClutch(outcomes, speciesData) {
  if (!speciesData) return null
  const min = speciesData.litter_size_min || speciesData.avg_clutch_size || 4
  const max = speciesData.litter_size_max || speciesData.avg_clutch_size || 8
  const avg = Math.round((min + max) / 2)

  return {
    min,
    max,
    avg,
    projections: outcomes.map(o => ({
      label:       o.label,
      probability: o.probability,
      expectedMin: parseFloat((o.probability * min).toFixed(1)),
      expectedAvg: parseFloat((o.probability * avg).toFixed(1)),
      expectedMax: parseFloat((o.probability * max).toFixed(1)),
    })).filter(p => p.probability > 0.001),
  }
}


// ── Sex-linked cross (Banana / Coral Glow) ───────────────────────────────────
//
// Ball python sex determination is XY (males XY, females XX).
// Banana/Coral Glow sits in the pseudoautosomal region of the sex chromosomes.
//
// The maker type of a MALE determines sex ratios of Banana offspring:
//   Male Maker male:   ~93% of Banana offspring are MALE,   ~93% of normals are FEMALE
//   Female Maker male: ~93% of Banana offspring are FEMALE, ~93% of normals are MALE
//   Female Banana:     always produces normal 50/50 sex ratios
//   Super Banana:      behaves like a female — normal 50/50 sex ratios
//
// For the genetics calculator we output:
//   - The morph outcomes (Normal / Single / Super) with standard co-dom ratios
//   - A sex ratio note per outcome based on maker type
//
// makerType: 'male_maker' | 'female_maker' | 'unknown' | null
// parentSex: 'male' | 'female'

function sexLinkedCross(maleExpr, femaleExpr, maleMakerType, superFormName) {
  // Morph probability outcomes follow standard co-dominant rules
  const morphOutcomes = coDominantCross(maleExpr, femaleExpr, superFormName)

  // Determine sex ratio notes for each morph outcome
  const withSexRatios = morphOutcomes.map(o => {
    let sexNote = null

    if (o.genotype === 'normal') {
      // Normal offspring sex ratio depends on whether male parent is maker
      if (maleExpr === 'single' || maleExpr === 'visual') {
        // Male parent is a visual Banana
        if (maleMakerType === 'male_maker') {
          sexNote = '~93% female'
        } else if (maleMakerType === 'female_maker') {
          sexNote = '~93% male'
        } else {
          sexNote = 'sex ratio unknown (need maker type)'
        }
      }
    } else if (o.genotype === 'single' || o.genotype === 'super') {
      // Banana-carrying offspring sex ratio
      if (maleExpr === 'single' || maleExpr === 'visual') {
        if (maleMakerType === 'male_maker') {
          sexNote = '~93% male'
        } else if (maleMakerType === 'female_maker') {
          sexNote = '~93% female'
        } else {
          sexNote = 'sex ratio unknown (need maker type)'
        }
      }
      // If male is normal and female is banana, or female is banana, 50/50
      if (femaleExpr === 'single' || femaleExpr === 'visual' || femaleExpr === 'super') {
        if (maleExpr === 'normal') {
          sexNote = '50/50 sex ratio'
        }
      }
      // Super Banana always 50/50
      if (o.genotype === 'super') {
        sexNote = '50/50 sex ratio'
      }
    }

    return { ...o, sexNote, isSexLinked: true }
  })

  return withSexRatios
}


// ── Pairing suggestion engine ────────────────────────────────────────────────

function suggestPairings(animals) {
  const males   = animals.filter(a => a.sex === 'male'   && a.status === 'active')
  const females = animals.filter(a => a.sex === 'female' && a.status === 'active')
  const suggestions = []

  for (const male of males) {
    for (const female of females) {
      if (male.species_id !== female.species_id) continue
      const result = scorePairing(male, female)
      if (result.score > 0) suggestions.push({ male, female, ...result })
    }
  }

  suggestions.sort((a,b) => b.score - a.score)
  return suggestions.slice(0, 50)
}

function scorePairing(male, female) {
  let score = 0
  const reasons = []
  const mm = male.morphs || []
  const fm = female.morphs || []

  const maleRec   = mm.filter(m => m.inheritance_type === 'recessive')
  const femaleRec = fm.filter(m => m.inheritance_type === 'recessive')

  const sharedRec = maleRec.filter(m => femaleRec.some(f => f.morph_id === m.morph_id))
  for (const s of sharedRec) {
    score += 30
    reasons.push(`Both carry ${s.morph_name} — can produce visuals`)
  }

  for (const m of maleRec) {
    if (m.expression === 'visual') {
      const match = femaleRec.find(f => f.morph_id === m.morph_id && f.expression === 'het')
      if (match) { score += 20; reasons.push(`Male visual ${m.morph_name} × female het → 50% visual offspring`) }
    }
  }

  const maleCod = mm.filter(m => m.inheritance_type === 'co_dominant' && m.expression === 'visual')
  if (maleCod.length > 0) {
    score += 10 * maleCod.length
    reasons.push(`${maleCod.map(m=>m.morph_name).join(', ')} will pass to ~50% of offspring`)
  }

  // BEL complex potential
  const BEL_IDS = ['bp_lesser','bp_mojave','bp_phantom','bp_mystic','bp_butter','bp_mocha','bp_russo_cod','bp_special']
  const maleBel   = mm.filter(m => BEL_IDS.includes(m.morph_id))
  const femaleBel = fm.filter(m => BEL_IDS.includes(m.morph_id))
  if (maleBel.length > 0 && femaleBel.length > 0) {
    score += 25
    reasons.push('BEL complex combination — may produce Blue Eyed Leucistics')
  }

  // Sex-linked gene pairings (Banana/Coral Glow)
  const SEX_LINKED_IDS = ['bp_banana', 'bp_coral_glow']
  const maleSL   = mm.filter(m => SEX_LINKED_IDS.includes(m.morph_id))
  const femaleSL = fm.filter(m => SEX_LINKED_IDS.includes(m.morph_id))
  if (maleSL.length > 0) {
    const makerType = male.sex_linked_maker
    const makerLabel = makerType === 'male_maker' ? 'Male Maker' : makerType === 'female_maker' ? 'Female Maker' : 'maker type unknown'
    score += 20
    reasons.push(`Male Banana/Coral Glow (${makerLabel}) — sex ratios will be skewed in offspring`)
  }
  if (femaleSL.length > 0 && maleSL.length === 0) {
    score += 15
    reasons.push('Female Banana/Coral Glow — normal sex ratios, male Banana offspring will be Female Makers')
  }

  if (score === 0 && (mm.length > 0 || fm.length > 0)) {
    score = 5
    reasons.push('Different morphs — interesting normals with hidden genes possible')
  }

  return { score, reasons, highlights: reasons.slice(0,2) }
}

module.exports = {
  calculateOffspring,
  projectClutch,
  recessiveCross,
  coDominantCross,
  dominantCross,
  suggestPairings,
  _buildOutcomeFromParts: buildOutcomeFromParts,
}
