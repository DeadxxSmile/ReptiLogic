/**
 * ReptiLogic — Genetics Calculator Engine
 *
 * Calculates possible offspring outcomes from two parents.
 * Handles: recessive, co-dominant, dominant, and line-bred genes.
 *
 * Key concepts:
 *   - Recessive:    animal must have TWO copies to be visual (hom)
 *   - Co-dominant:  one copy = visual het form, two copies = super form
 *   - Dominant:     one copy = visual, two copies = lethal or same visual
 *   - Line-bred:    probabilistic, not Mendelian — we show rough percentages
 */

'use strict'

// ── Genotype constants ───────────────────────────────────────────────────────
const GENOTYPE = {
  // Recessive
  NORMAL:    'nn',   // no copies
  HET:       'nh',   // one copy (carrier, not visual)
  VISUAL:    'hh',   // two copies (visual)
  // Co-dominant / Dominant
  SINGLE:    'N+',   // one copy (visual)
  SUPER:     '++',   // two copies (super / homozygous)
}

// ── Core Punnett functions ───────────────────────────────────────────────────

/**
 * Recessive cross.
 * Returns array of { genotype, probability, label } objects summing to 1.0
 *
 * Parent expressions accepted: 'normal', 'het', 'visual'
 */
function recessiveCross(parentA, parentB) {
  // Map expression to allele pairs
  const alleles = {
    normal:  ['n', 'n'],
    het:     ['n', 'h'],
    visual:  ['h', 'h'],
    // possible_het treated as het for calculation purposes (worst case)
    possible_het: ['n', 'h'],
    proven_het:   ['n', 'h'],
    super:        ['h', 'h'],  // alias for visual
  }

  const a = alleles[parentA] || alleles.normal
  const b = alleles[parentB] || alleles.normal

  // Build all 4 Punnett combinations
  const combos = []
  for (const ai of a) {
    for (const bi of b) {
      combos.push([ai, bi].sort().join(''))
    }
  }

  // Count frequencies
  const counts = { nn: 0, nh: 0, hh: 0 }
  for (const c of combos) {
    const key = c === 'hn' ? 'nh' : c
    counts[key] = (counts[key] || 0) + 1
  }

  const results = []
  if (counts.nn) results.push({ genotype: 'normal',  label: 'Normal',         probability: counts.nn / 4 })
  if (counts.nh) results.push({ genotype: 'het',     label: 'Het',            probability: counts.nh / 4 })
  if (counts.hh) results.push({ genotype: 'visual',  label: 'Visual',         probability: counts.hh / 4 })
  return results
}

/**
 * Co-dominant cross.
 * Parent expressions: 'normal', 'single' (visual het), 'super'
 */
function coDominantCross(parentA, parentB) {
  const alleles = {
    normal: ['n', 'n'],
    single: ['n', '+'],
    super:  ['+', '+'],
    // Map existing expression names
    visual: ['n', '+'],  // visual = single copy for co-doms
    het:    ['n', 'n'],  // het doesn't really apply to co-doms; treat as normal
  }

  const a = alleles[parentA] || alleles.normal
  const b = alleles[parentB] || alleles.normal

  const combos = []
  for (const ai of a) {
    for (const bi of b) {
      combos.push([ai, bi].sort().join(''))
    }
  }

  const counts = { nn: 0, 'n+': 0, '++': 0 }
  for (const c of combos) {
    const key = c === '+n' ? 'n+' : c
    counts[key] = (counts[key] || 0) + 1
  }

  const results = []
  if (counts['nn']) results.push({ genotype: 'normal', label: 'Normal',        probability: counts['nn'] / 4 })
  if (counts['n+']) results.push({ genotype: 'single', label: 'Single copy',   probability: counts['n+'] / 4 })
  if (counts['++']) results.push({ genotype: 'super',  label: 'Super / Homozygous', probability: counts['++'] / 4 })
  return results
}

/**
 * Dominant cross.
 * One copy = visual. Two copies = super (which may be lethal in some species).
 */
function dominantCross(parentA, parentB) {
  // For dominant, we use same logic as co-dominant
  return coDominantCross(parentA, parentB)
}

// ── Multi-gene calculator ────────────────────────────────────────────────────

/**
 * Calculate all possible offspring combinations from two parents.
 *
 * @param {Array} maleGenes   - Array of { morphId, morphName, inheritanceType, superFormName, expression }
 * @param {Array} femaleGenes - Same structure
 * @param {Object} morphMap   - Map of morphId → morph data (for display names)
 * @returns {Object} { outcomes: Array, summary: Object }
 */
function calculateOffspring(maleGenes, femaleGenes, morphMap = {}) {
  // Build a combined list of all unique genes involved
  const allMorphIds = new Set([
    ...maleGenes.map(g => g.morphId),
    ...femaleGenes.map(g => g.morphId),
  ])

  // For each gene, calculate the single-gene outcome probabilities
  const geneOutcomes = {}

  for (const morphId of allMorphIds) {
    const male   = maleGenes.find(g => g.morphId === morphId)
    const female = femaleGenes.find(g => g.morphId === morphId)

    const maleExpr   = male   ? normaliseExpression(male.expression,   male.inheritanceType)   : 'normal'
    const femaleExpr = female ? normaliseExpression(female.expression, female.inheritanceType) : 'normal'

    const inheritanceType = (male || female).inheritanceType

    let outcomes
    if (inheritanceType === 'recessive') {
      outcomes = recessiveCross(maleExpr, femaleExpr)
    } else if (inheritanceType === 'co_dominant') {
      outcomes = coDominantCross(maleExpr, femaleExpr)
    } else if (inheritanceType === 'dominant') {
      outcomes = dominantCross(maleExpr, femaleExpr)
    } else {
      // line_bred / polygenetic — approximate
      outcomes = linebredEstimate(maleExpr, femaleExpr)
    }

    geneOutcomes[morphId] = {
      morphId,
      morphName:     (male || female).morphName,
      inheritanceType,
      superFormName: (male || female).superFormName || null,
      hasHealthConcern: (male || female).hasHealthConcern || false,
      healthConcernDesc: (male || female).healthConcernDesc || null,
      singleGeneOutcomes: outcomes,
    }
  }

  // If no genes involved, all offspring are normal
  if (allMorphIds.size === 0) {
    return {
      outcomes: [{ genes: [], probability: 1.0, label: 'Normal', description: '100% normal' }],
      geneOutcomes: {},
      healthWarnings: [],
    }
  }

  // Combine all gene outcomes via cartesian product
  const combinedOutcomes = cartesianProduct(geneOutcomes)

  // Flag health concerns
  const healthWarnings = Object.values(geneOutcomes)
    .filter(g => g.hasHealthConcern)
    .map(g => ({
      morphName: g.morphName,
      description: g.healthConcernDesc,
    }))

  return {
    outcomes: combinedOutcomes,
    geneOutcomes,
    healthWarnings,
    summary: buildSummary(combinedOutcomes),
  }
}

/**
 * Build cartesian product of all gene outcomes.
 * Returns sorted array of combined outcomes with total probability.
 */
function cartesianProduct(geneOutcomes) {
  const genes = Object.values(geneOutcomes)

  // Start with a single "empty" combination
  let combinations = [{ genes: [], probability: 1.0 }]

  for (const gene of genes) {
    const newCombinations = []

    for (const existing of combinations) {
      for (const outcome of gene.singleGeneOutcomes) {
        newCombinations.push({
          genes: [
            ...existing.genes,
            {
              morphId:       gene.morphId,
              morphName:     gene.morphName,
              inheritanceType: gene.inheritanceType,
              superFormName: gene.superFormName,
              genotype:      outcome.genotype,
              label:         outcome.label,
              hasHealthConcern: gene.hasHealthConcern,
            }
          ],
          probability: existing.probability * outcome.probability,
        })
      }
    }

    combinations = newCombinations
  }

  // Add display labels to each combination
  for (const combo of combinations) {
    combo.label       = buildComboLabel(combo.genes)
    combo.description = buildComboDescription(combo.genes, combo.probability)
    combo.hasHealthConcern = combo.genes.some(g => g.hasHealthConcern && g.genotype !== 'normal')
  }

  // Sort by probability descending
  combinations.sort((a, b) => b.probability - a.probability)

  return combinations
}

/**
 * Build a human-readable label for a gene combination.
 * e.g. "Pastel Spider het Albino"
 */
function buildComboLabel(genes) {
  const parts = []

  // Visuals first (most impressive)
  for (const g of genes) {
    if (g.genotype === 'visual' || g.genotype === 'single') {
      parts.push(g.morphName)
    } else if (g.genotype === 'super') {
      parts.push(g.superFormName || `Super ${g.morphName}`)
    }
  }

  // Then hets
  const hets = genes
    .filter(g => g.genotype === 'het')
    .map(g => `Het ${g.morphName}`)
  parts.push(...hets)

  // If nothing, it's normal
  if (parts.length === 0) return 'Normal'

  return parts.join(' ')
}

function buildComboDescription(genes, probability) {
  const pct = (probability * 100).toFixed(1)
  const label = buildComboLabel(genes)
  return `${pct}% ${label}`
}

function buildSummary(outcomes) {
  const visualOutcomes = outcomes.filter(o =>
    o.genes.some(g => g.genotype === 'visual' || g.genotype === 'single' || g.genotype === 'super')
  )

  const normalOutcome = outcomes.find(o => o.label === 'Normal')
  const normalPct = normalOutcome ? (normalOutcome.probability * 100).toFixed(1) : '0'
  const morphPct = (100 - parseFloat(normalPct)).toFixed(1)

  return {
    totalOutcomes:  outcomes.length,
    morphPercent:   parseFloat(morphPct),
    normalPercent:  parseFloat(normalPct),
    uniqueVisuals:  visualOutcomes.length,
  }
}

/**
 * Normalise expression strings to what our functions expect.
 */
function normaliseExpression(expression, inheritanceType) {
  if (inheritanceType === 'co_dominant' || inheritanceType === 'dominant') {
    // For co-doms: 'visual' means single copy
    if (expression === 'visual') return 'single'
    if (expression === 'super')  return 'super'
    return 'normal'
  }
  // For recessive
  if (expression === 'super') return 'visual'
  return expression || 'normal'
}

/**
 * Line-bred / polygenetic estimate.
 * Not Mendelian. We use broad probability bands.
 */
function linebredEstimate(parentA, parentB) {
  // Both visual (line-bred trait) → ~75% express
  if ((parentA === 'visual' || parentA === 'single') &&
      (parentB === 'visual' || parentB === 'single')) {
    return [
      { genotype: 'visual', label: 'Expresses trait',      probability: 0.75 },
      { genotype: 'normal', label: 'Normal / non-express', probability: 0.25 },
    ]
  }
  // One visual × normal → ~25% express
  if ((parentA === 'visual' || parentA === 'single') ||
      (parentB === 'visual' || parentB === 'single')) {
    return [
      { genotype: 'visual', label: 'Expresses trait',      probability: 0.25 },
      { genotype: 'normal', label: 'Normal / non-express', probability: 0.75 },
    ]
  }
  return [
    { genotype: 'normal', label: 'Normal', probability: 1.0 },
  ]
}

// ── Pairing suggestion engine ────────────────────────────────────────────────

/**
 * Given a collection of animals, suggest potentially interesting pairings.
 * Returns an array of { male, female, score, reasons, highlights } objects.
 */
function suggestPairings(animals) {
  const males   = animals.filter(a => a.sex === 'male'   && a.status === 'active')
  const females = animals.filter(a => a.sex === 'female' && a.status === 'active')

  const suggestions = []

  for (const male of males) {
    for (const female of females) {
      if (male.species_id !== female.species_id) continue

      const result = scorePairing(male, female)
      if (result.score > 0) {
        suggestions.push({ male, female, ...result })
      }
    }
  }

  // Sort by score descending
  suggestions.sort((a, b) => b.score - a.score)
  return suggestions.slice(0, 50) // top 50
}

function scorePairing(male, female) {
  let score = 0
  const reasons = []

  const maleMorphs   = male.morphs   || []
  const femaleMorphs = female.morphs || []

  // Both carry complementary recessive genes → great pairing
  const maleRec   = maleMorphs.filter(m => m.inheritance_type === 'recessive')
  const femaleRec = femaleMorphs.filter(m => m.inheritance_type === 'recessive')

  const sharedRec = maleRec.filter(m =>
    femaleRec.some(f => f.morph_id === m.morph_id)
  )

  for (const shared of sharedRec) {
    if (shared.expression === 'visual' || shared.expression === 'het') {
      score += 30
      reasons.push(`Both carry ${shared.morph_name} — can produce visuals`)
    }
  }

  // One is visual recessive, other is het → produce 50% het offspring
  for (const mm of maleRec) {
    if (mm.expression === 'visual') {
      const match = femaleRec.find(f => f.morph_id === mm.morph_id && f.expression === 'het')
      if (match) {
        score += 20
        reasons.push(`Male visual ${mm.morph_name} × female het → 50% visual offspring`)
      }
    }
  }

  // Co-dom × normal → 50% single copy offspring
  const maleCod = maleMorphs.filter(m => m.inheritance_type === 'co_dominant' && m.expression === 'visual')
  if (maleCod.length > 0) {
    score += 10 * maleCod.length
    reasons.push(`${maleCod.map(m => m.morph_name).join(', ')} will pass to ~50% of offspring`)
  }

  // No morphs in common but both have morphs → still interesting
  if (score === 0 && (maleMorphs.length > 0 || femaleMorphs.length > 0)) {
    score = 5
    reasons.push('Different morph combinations may produce interesting normals with hidden genes')
  }

  return {
    score,
    reasons,
    highlights: reasons.slice(0, 2),
  }
}

module.exports = {
  calculateOffspring,
  recessiveCross,
  coDominantCross,
  dominantCross,
  suggestPairings,
  // Exported for testing
  _buildComboLabel: buildComboLabel,
  _cartesianProduct: cartesianProduct,
}
