/**
 * Animal IPC Handlers
 * Bridges the renderer (React) ↔ main process ↔ SQLite
 */

'use strict'

const { v4: uuidv4 } = require('uuid')
const { getDb } = require('../database/db')

function normalizeMorphExpression(expression) {
  // Older renderer builds used 'single' for a one-copy co-dominant gene.
  if (expression === 'single') return 'visual'
  return expression || 'visual'
}

// ── Queries ──────────────────────────────────────────────────────────────────

function getAllAnimals() {
  const db = getDb()

  const animals = db.prepare(`
    SELECT
      a.*,
      s.common_name   AS species_name,
      p.filename      AS primary_photo_filename
    FROM animals a
    JOIN species s ON s.id = a.species_id
    LEFT JOIN photos p ON p.id = a.primary_photo_id
    ORDER BY a.created_at DESC
  `).all()

  // Prepare once, call in loop — avoids N+1 re-preparation overhead
  const getMorphs = db.prepare(`
    SELECT
      am.*,
      m.name            AS morph_name,
      m.inheritance_type,
      m.has_health_concern,
      m.health_concern_desc,
      m.super_form_name,
      m.category
    FROM animal_morphs am
    JOIN morphs m ON m.id = am.morph_id
    WHERE am.animal_id = ?
    ORDER BY m.sort_order, m.name
  `)

  for (const animal of animals) {
    animal.morphs = getMorphs.all(animal.id)
  }

  return animals
}

function getAnimalById(id) {
  const db = getDb()

  const animal = db.prepare(`
    SELECT
      a.*,
      s.common_name   AS species_name,
      s.scientific_name,
      p.filename      AS primary_photo_filename
    FROM animals a
    JOIN species s ON s.id = a.species_id
    LEFT JOIN photos p ON p.id = a.primary_photo_id
    WHERE a.id = ?
  `).get(id)

  if (!animal) return null

  animal.morphs = db.prepare(`
    SELECT am.*, m.name AS morph_name, m.inheritance_type,
           m.has_health_concern, m.health_concern_desc,
           m.super_form_name, m.category, m.gene_symbol
    FROM animal_morphs am
    JOIN morphs m ON m.id = am.morph_id
    WHERE am.animal_id = ?
    ORDER BY m.sort_order
  `).all(id)

  animal.photos = db.prepare(
    `SELECT * FROM photos WHERE animal_id = ? ORDER BY is_primary DESC, created_at`
  ).all(id)

  animal.measurements = db.prepare(
    `SELECT * FROM measurements WHERE animal_id = ? ORDER BY measured_at DESC LIMIT 20`
  ).all(id)

  animal.feedings = db.prepare(
    `SELECT * FROM feedings WHERE animal_id = ? ORDER BY fed_at DESC LIMIT 30`
  ).all(id)

  return animal
}

function getAnimalHistory(id) {
  const db = getDb()

  const breedingRecords = db.prepare(`
    SELECT
      br.*,
      m.name   AS male_name,
      f.name   AS female_name,
      c.lay_date,
      c.hatch_date,
      c.total_eggs,
      c.hatched_count,
      c.slug_count
    FROM breeding_records br
    JOIN animals m ON m.id = br.male_id
    JOIN animals f ON f.id = br.female_id
    LEFT JOIN clutches c ON c.breeding_record_id = br.id
    WHERE br.male_id = ? OR br.female_id = ?
    ORDER BY COALESCE(br.first_pairing_date, br.created_at) DESC
  `).all(id, id)

  const measurements = db.prepare(
    `SELECT * FROM measurements WHERE animal_id = ? ORDER BY measured_at ASC`
  ).all(id)

  const feedings = db.prepare(
    `SELECT * FROM feedings WHERE animal_id = ? ORDER BY fed_at DESC LIMIT 50`
  ).all(id)

  return { breedingRecords, measurements, feedings }
}

function createAnimal(data) {
  const db = getDb()
  const id = data.id || uuidv4()
  const now = new Date().toISOString()

  // Wrap animal + morph inserts in a single transaction — atomic, faster
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO animals (
        id, species_id, name, sex, dob, dob_estimated,
        weight_grams, acquired_date, acquired_from,
        acquisition_price, status, notes, created_at, updated_at
      ) VALUES (
        @id, @species_id, @name, @sex, @dob, @dob_estimated,
        @weight_grams, @acquired_date, @acquired_from,
        @acquisition_price, @status, @notes, @created_at, @updated_at
      )
    `).run({
      id,
      species_id:        data.species_id,
      name:              data.name,
      sex:               data.sex || 'unknown',
      dob:               data.dob || null,
      dob_estimated:     data.dob_estimated ? 1 : 0,
      weight_grams:      data.weight_grams || null,
      acquired_date:     data.acquired_date || null,
      acquired_from:     data.acquired_from || null,
      acquisition_price: data.acquisition_price || null,
      status:            data.status || 'active',
      notes:             data.notes || null,
      created_at:        now,
      updated_at:        now,
    })

    if (data.morphs && data.morphs.length > 0) {
      const insertMorph = db.prepare(`
        INSERT OR IGNORE INTO animal_morphs (id, animal_id, morph_id, expression, het_percent, confirmed, notes)
        VALUES (@id, @animal_id, @morph_id, @expression, @het_percent, @confirmed, @notes)
      `)
      for (const morph of data.morphs) {
        insertMorph.run({
          id:          uuidv4(),
          animal_id:   id,
          morph_id:    morph.morph_id,
          expression:  normalizeMorphExpression(morph.expression),
          het_percent: morph.het_percent || null,
          confirmed:   morph.confirmed ? 1 : 0,
          notes:       morph.notes || null,
        })
      }
    }
  })

  tx()
  return getAnimalById(id)
}

function updateAnimal(id, data) {
  const db = getDb()

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE animals SET
        name              = COALESCE(@name, name),
        sex               = COALESCE(@sex, sex),
        dob               = @dob,
        dob_estimated     = COALESCE(@dob_estimated, dob_estimated),
        weight_grams      = @weight_grams,
        length_cm         = @length_cm,
        acquired_date     = @acquired_date,
        acquired_from     = @acquired_from,
        acquisition_price = @acquisition_price,
        status            = COALESCE(@status, status),
        status_date       = @status_date,
        status_notes      = @status_notes,
        notes             = @notes,
        updated_at        = @updated_at
      WHERE id = @id
    `).run({
      id,
      name:              data.name || null,
      sex:               data.sex || null,
      dob:               data.dob !== undefined ? data.dob : null,
      dob_estimated:     data.dob_estimated !== undefined ? (data.dob_estimated ? 1 : 0) : null,
      weight_grams:      data.weight_grams !== undefined ? data.weight_grams : null,
      length_cm:         data.length_cm !== undefined ? data.length_cm : null,
      acquired_date:     data.acquired_date !== undefined ? data.acquired_date : null,
      acquired_from:     data.acquired_from !== undefined ? data.acquired_from : null,
      acquisition_price: data.acquisition_price !== undefined ? data.acquisition_price : null,
      status:            data.status || null,
      status_date:       data.status_date !== undefined ? data.status_date : null,
      status_notes:      data.status_notes !== undefined ? data.status_notes : null,
      notes:             data.notes !== undefined ? data.notes : null,
      updated_at:        new Date().toISOString(),
    })

    if (data.morphs !== undefined) {
      db.prepare('DELETE FROM animal_morphs WHERE animal_id = ?').run(id)

      if (data.morphs.length > 0) {
        const insertMorph = db.prepare(`
          INSERT INTO animal_morphs (id, animal_id, morph_id, expression, het_percent, confirmed, notes)
          VALUES (@id, @animal_id, @morph_id, @expression, @het_percent, @confirmed, @notes)
        `)
        for (const morph of data.morphs) {
          insertMorph.run({
            id:          uuidv4(),
            animal_id:   id,
            morph_id:    morph.morph_id,
            expression:  normalizeMorphExpression(morph.expression),
            het_percent: morph.het_percent || null,
            confirmed:   morph.confirmed ? 1 : 0,
            notes:       morph.notes || null,
          })
        }
      }
    }
  })

  tx()
  return getAnimalById(id)
}

function deleteAnimal(id) {
  const db = getDb()
  db.prepare('DELETE FROM animals WHERE id = ?').run(id)
  return { success: true }
}

// ── Register handlers ────────────────────────────────────────────────────────

function register(ipcMain) {
  ipcMain.handle('animals:getAll',     ()              => getAllAnimals())
  ipcMain.handle('animals:getById',    (_, id)         => getAnimalById(id))
  ipcMain.handle('animals:create',     (_, data)       => createAnimal(data))
  ipcMain.handle('animals:update',     (_, id, data)   => updateAnimal(id, data))
  ipcMain.handle('animals:delete',     (_, id)         => deleteAnimal(id))
  ipcMain.handle('animals:getHistory', (_, id)         => getAnimalHistory(id))

  ipcMain.handle('species:getAll', () => {
    return getDb().prepare('SELECT * FROM species ORDER BY common_name').all()
  })
}

module.exports = { register }
