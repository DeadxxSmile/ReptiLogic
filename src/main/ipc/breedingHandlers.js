'use strict'

const { v4: uuidv4 } = require('uuid')
const { getDb } = require('../database/db')
const genetics  = require('../genetics/calculator')

function register(ipcMain) {

  ipcMain.handle('breeding:getAll', () => {
    const db = getDb()
    const records = db.prepare(`
      SELECT
        br.*,
        m.name AS male_name, m.species_id,
        f.name AS female_name,
        s.gives_live_birth,
        mp.filename AS male_photo,
        fp.filename AS female_photo
      FROM breeding_records br
      JOIN animals m ON m.id = br.male_id
      JOIN animals f ON f.id = br.female_id
      LEFT JOIN species s ON s.id = m.species_id
      LEFT JOIN photos mp ON mp.id = m.primary_photo_id
      LEFT JOIN photos fp ON fp.id = f.primary_photo_id
      ORDER BY COALESCE(br.first_pairing_date, br.created_at) DESC
    `).all()

    const getClutches = db.prepare('SELECT * FROM clutches WHERE breeding_record_id = ? ORDER BY lay_date')
    for (const r of records) r.clutches = getClutches.all(r.id)
    return records
  })

  ipcMain.handle('breeding:getById', (_, id) => {
    const db = getDb()
    const record = db.prepare(`
      SELECT br.*,
        m.name AS male_name, f.name AS female_name, m.species_id,
        s.gives_live_birth,
        mp.filename AS male_photo, fp.filename AS female_photo
      FROM breeding_records br
      JOIN animals m ON m.id = br.male_id
      JOIN animals f ON f.id = br.female_id
      LEFT JOIN species s ON s.id = m.species_id
      LEFT JOIN photos mp ON mp.id = m.primary_photo_id
      LEFT JOIN photos fp ON fp.id = f.primary_photo_id
      WHERE br.id = ?
    `).get(id)

    if (!record) return null

    record.clutches       = db.prepare('SELECT * FROM clutches WHERE breeding_record_id = ? ORDER BY COALESCE(lay_date, created_at)').all(id)
    record.pairing_events = db.prepare('SELECT * FROM pairing_events WHERE breeding_record_id = ? ORDER BY paired_at DESC').all(id)

    const getOffspring = db.prepare('SELECT * FROM offspring WHERE clutch_id = ? ORDER BY created_at')
    for (const c of record.clutches) c.offspring = getOffspring.all(c.id)

    return record
  })

  ipcMain.handle('breeding:create', (_, data) => {
    const db  = getDb()
    const id  = uuidv4()
    const now = new Date().toISOString()
    const male = db.prepare('SELECT species_id FROM animals WHERE id = ?').get(data.male_id)

    db.prepare(`
      INSERT INTO breeding_records
        (id, species_id, male_id, female_id, first_pairing_date, status, notes, created_at, updated_at)
      VALUES
        (@id, @species_id, @male_id, @female_id, @first_pairing_date, @status, @notes, @created_at, @updated_at)
    `).run({
      id,
      species_id:         male?.species_id || 'ball_python',
      male_id:            data.male_id,
      female_id:          data.female_id,
      first_pairing_date: data.first_pairing_date || null,
      status:             data.status || 'planned',
      notes:              data.notes  || null,
      created_at:         now,
      updated_at:         now,
    })

    return db.prepare('SELECT * FROM breeding_records WHERE id = ?').get(id)
  })

  ipcMain.handle('breeding:update', (_, id, data) => {
    const db = getDb()
    const allowed = [
      'first_pairing_date','last_pairing_date','lock_date','confirmed_ovulation_date',
      'pre_lay_shed_date','status','pairing_count','total_eggs','fertile_eggs',
      'slug_count','hatched_count','notes',
    ]
    const fields = []
    const params = { id }

    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = @${field}`)
        params[field] = data[field]
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = @updated_at')
      params.updated_at = new Date().toISOString()
      db.prepare(`UPDATE breeding_records SET ${fields.join(', ')} WHERE id = @id`).run(params)
    }

    return db.prepare('SELECT * FROM breeding_records WHERE id = ?').get(id)
  })

  ipcMain.handle('breeding:delete', (_, id) => {
    getDb().prepare('DELETE FROM breeding_records WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('breeding:getByAnimal', (_, animalId) => {
    return getDb().prepare(`
      SELECT br.*, m.name AS male_name, f.name AS female_name
      FROM breeding_records br
      JOIN animals m ON m.id = br.male_id
      JOIN animals f ON f.id = br.female_id
      WHERE br.male_id = ? OR br.female_id = ?
      ORDER BY COALESCE(br.first_pairing_date, br.created_at) DESC
    `).all(animalId, animalId)
  })

  // ── Clutches ────────────────────────────────────────────────────────────────

  ipcMain.handle('clutches:getByBreeding', (_, breedingId) => {
    return getDb().prepare('SELECT * FROM clutches WHERE breeding_record_id = ? ORDER BY COALESCE(lay_date, created_at)').all(breedingId)
  })

  ipcMain.handle('clutches:create', (_, data) => {
    const db  = getDb()
    const id  = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO clutches (
        id, breeding_record_id, lay_date, hatch_date,
        total_eggs, fertile_eggs, slug_count, hatched_count,
        incubation_temp_f, incubation_humidity_pct, incubator_type, notes,
        created_at, updated_at
      ) VALUES (
        @id, @breeding_record_id, @lay_date, @hatch_date,
        @total_eggs, @fertile_eggs, @slug_count, @hatched_count,
        @incubation_temp_f, @incubation_humidity_pct, @incubator_type, @notes,
        @created_at, @updated_at
      )
    `).run({
      id,
      breeding_record_id:      data.breeding_record_id,
      lay_date:                data.lay_date   || null,
      hatch_date:              data.hatch_date  || null,
      total_eggs:              Number(data.total_eggs)    || 0,
      fertile_eggs:            data.fertile_eggs != null ? Number(data.fertile_eggs) : null,
      slug_count:              Number(data.slug_count)    || 0,
      hatched_count:           data.hatched_count != null ? Number(data.hatched_count) : null,
      incubation_temp_f:       data.incubation_temp_f        ? Number(data.incubation_temp_f)        : null,
      incubation_humidity_pct: data.incubation_humidity_pct  ? Number(data.incubation_humidity_pct)  : null,
      incubator_type:          data.incubator_type || null,
      notes:                   data.notes          || null,
      created_at:              now,
      updated_at:              now,
    })

    // Roll up totals to the breeding record
    db.prepare(`
      UPDATE breeding_records SET
        total_eggs    = (SELECT COALESCE(SUM(total_eggs),   0) FROM clutches WHERE breeding_record_id = @brId),
        slug_count    = (SELECT COALESCE(SUM(slug_count),   0) FROM clutches WHERE breeding_record_id = @brId),
        hatched_count = (SELECT COALESCE(SUM(COALESCE(hatched_count,0)), 0) FROM clutches WHERE breeding_record_id = @brId),
        updated_at    = @now
      WHERE id = @brId
    `).run({ brId: data.breeding_record_id, now })

    return db.prepare('SELECT * FROM clutches WHERE id = ?').get(id)
  })

  ipcMain.handle('clutches:update', (_, id, data) => {
    const db      = getDb()
    const allowed = ['lay_date','hatch_date','total_eggs','fertile_eggs','slug_count',
                     'hatched_count','incubation_temp_f','incubation_humidity_pct','incubator_type','notes']
    const fields  = []
    const params  = { id }

    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = @${field}`)
        params[field] = data[field]
      }
    }
    if (fields.length > 0) {
      fields.push('updated_at = @updated_at')
      params.updated_at = new Date().toISOString()
      db.prepare(`UPDATE clutches SET ${fields.join(', ')} WHERE id = @id`).run(params)
    }
    return db.prepare('SELECT * FROM clutches WHERE id = ?').get(id)
  })

  ipcMain.handle('clutches:delete', (_, id) => {
    getDb().prepare('DELETE FROM clutches WHERE id = ?').run(id)
    return { success: true }
  })

  // ── Genetics ────────────────────────────────────────────────────────────────

  ipcMain.handle('genetics:calculate', (_, maleGenes, femaleGenes, speciesId) => {
    const db = getDb()
    const result = genetics.calculateOffspring(maleGenes, femaleGenes)
    if (speciesId) {
      const speciesData = db.prepare('SELECT * FROM species WHERE id = ?').get(speciesId)
      result.clutchProjection = genetics.projectClutch(result.outcomes, speciesData)
      result.speciesData = speciesData
    }
    return result
  })

  ipcMain.handle('breeding:calculateOutcomes', (_, maleId, femaleId) => {
    const db = getDb()
    const getMorphs = (animalId) => db.prepare(`
      SELECT am.expression, am.het_percent,
             m.id AS morphId, m.name AS morphName,
             m.inheritance_type AS inheritanceType,
             m.super_form_name  AS superFormName,
             m.has_health_concern   AS hasHealthConcern,
             m.health_concern_desc  AS healthConcernDesc,
             m.allele_group_id      AS alleleGroupId,
             m.cross_allele_result  AS crossAlleleResult,
             m.is_sex_linked        AS isSexLinked
      FROM animal_morphs am
      JOIN morphs m ON m.id = am.morph_id
      WHERE am.animal_id = ?
    `).all(animalId)

    const maleAnimal  = db.prepare('SELECT species_id, sex_linked_maker FROM animals WHERE id = ?').get(maleId)
    const speciesId   = maleAnimal?.species_id
    const speciesData = speciesId ? db.prepare('SELECT * FROM species WHERE id = ?').get(speciesId) : null

    const maleGenes   = getMorphs(maleId).map(g => ({
      ...g,
      // Attach maker type to sex-linked genes so calculator can use it
      makerType: g.isSexLinked ? (maleAnimal?.sex_linked_maker || null) : null,
    }))
    const femaleGenes = getMorphs(femaleId)

    const result      = genetics.calculateOffspring(maleGenes, femaleGenes)
    result.clutchProjection = genetics.projectClutch(result.outcomes, speciesData)
    result.speciesData      = speciesData
    return result
  })

  ipcMain.handle('breeding:getSuggestedPairs', (_, speciesId) => {
    const db = getDb()
    const animals = db.prepare(`
      SELECT a.*, s.common_name AS species_name, p.filename AS primary_photo_filename
      FROM animals a
      JOIN species s ON s.id = a.species_id
      LEFT JOIN photos p ON p.id = a.primary_photo_id
      WHERE a.status = 'active'
      ${speciesId ? "AND a.species_id = ?" : ""}
    `).all(...(speciesId ? [speciesId] : []))

    const getMorphs = db.prepare(`
      SELECT am.*, m.name AS morph_name, m.inheritance_type, m.id AS morph_id
      FROM animal_morphs am JOIN morphs m ON m.id = am.morph_id
      WHERE am.animal_id = ?
    `)
    for (const a of animals) a.morphs = getMorphs.all(a.id)

    return genetics.suggestPairings(animals)
  })

  // Convert an offspring record into a full collection animal
  ipcMain.handle('offspring:addToCollection', (_, offspringId, animalData) => {
    const db       = getDb()
    const offspring = db.prepare('SELECT * FROM offspring WHERE id = ?').get(offspringId)
    if (!offspring) throw new Error('Offspring record not found')
    const breeding  = db.prepare('SELECT * FROM breeding_records WHERE id = ?').get(offspring.breeding_record_id)
    if (!breeding)  throw new Error('Breeding record not found')

    const animalId = uuidv4()
    const now      = new Date().toISOString()

    // Determine animal_id
    const setting = db.prepare("SELECT value FROM app_settings WHERE key = 'animal_id_mode'").get()
    let generatedAnimalId = animalData.animal_id || null
    if (!generatedAnimalId && (!setting || setting.value === 'auto')) {
      generatedAnimalId = generateAnimalId(db, breeding.species_id, animalData.sex || offspring.sex || 'unknown', animalData.morphs || [])
    }

    db.prepare(`
      INSERT INTO animals (
        id, species_id, animal_id, name, sex, dob, dob_estimated,
        weight_grams, acquired_date, status, notes,
        father_id, mother_id, created_at, updated_at
      ) VALUES (
        @id, @species_id, @animal_id, @name, @sex, @dob, 0,
        @weight_grams, @acquired_date, 'active', @notes,
        @father_id, @mother_id, @created_at, @updated_at
      )
    `).run({
      id: animalId, species_id: breeding.species_id,
      animal_id: generatedAnimalId,
      name:      animalData.name,
      sex:       animalData.sex || offspring.sex || 'unknown',
      dob:       animalData.dob || offspring.hatch_date || null,
      weight_grams: animalData.weight_grams || offspring.hatch_weight_grams || null,
      acquired_date: offspring.hatch_date || null,
      notes:     animalData.notes || null,
      father_id: breeding.male_id,
      mother_id: breeding.female_id,
      created_at: now, updated_at: now,
    })

    if (animalData.morphs?.length) {
      const ins = db.prepare(`
        INSERT OR IGNORE INTO animal_morphs (id, animal_id, morph_id, expression, het_percent, confirmed, notes)
        VALUES (@id, @animal_id, @morph_id, @expression, @het_percent, @confirmed, @notes)
      `)
      for (const m of animalData.morphs) {
        ins.run({ id: uuidv4(), animal_id: animalId, morph_id: m.morph_id, expression: m.expression || 'visual', het_percent: m.het_percent || null, confirmed: m.confirmed ? 1 : 0, notes: null })
      }
    }

    db.prepare('UPDATE offspring SET animal_id = ?, disposition = ? WHERE id = ?').run(animalId, 'kept', offspringId)
    return { success: true, animal_id: animalId, generated_id: generatedAnimalId }
  })
}

// ── Animal ID helpers (shared with breedingHandlers scope) ───────────────────
const SPECIES_CODES = {
  ball_python:'BP', western_hognose:'WH', corn_snake:'CS', boa_constrictor:'BC',
  carpet_python:'CP', burmese_python:'BU', reticulated_python:'RP',
  kingsnake:'KS', milk_snake:'MS', blue_tongue_skink:'BT',
}
function getSpeciesCode(id) {
  return SPECIES_CODES[id] || id.split('_').map(w=>w[0].toUpperCase()).join('').slice(0,3)
}
function getMorphCode(morphs) {
  if (!morphs?.length) return ''
  const code = morphs.slice(0,2).map(m=>(m.morph_name||m.name||'').split(/\s+/).map(w=>w[0]?.toUpperCase()||'').join('').slice(0,2)).join('')
  return code ? `-${code}` : ''
}
function generateAnimalId(db, speciesId, sex, morphs) {
  const sc = getSpeciesCode(speciesId)
  const sx = sex==='male'?'M':sex==='female'?'F':'U'
  db.prepare(`INSERT INTO animal_id_counters (species_id, sex, counter) VALUES (?,?,1) ON CONFLICT(species_id,sex) DO UPDATE SET counter=counter+1`).run(speciesId, sex)
  const row = db.prepare('SELECT counter FROM animal_id_counters WHERE species_id=? AND sex=?').get(speciesId, sex)
  return `${sc}${sx}${String(row.counter).padStart(3,'0')}${getMorphCode(morphs)}`
}

module.exports = { register }
