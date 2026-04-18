'use strict'

const path = require('path')
const fs   = require('fs')
const { v4: uuidv4 } = require('uuid')
const { getDb } = require('../database/db')

// ── Measurements ─────────────────────────────────────────────────────────────

function registerMeasurementHandlers(ipcMain) {
  ipcMain.handle('measurements:add', (_, animalId, data) => {
    const db  = getDb()
    const id  = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO measurements (id, animal_id, measured_at, weight_grams, length_cm, notes)
      VALUES (@id, @animal_id, @measured_at, @weight_grams, @length_cm, @notes)
    `).run({
      id,
      animal_id:    animalId,
      measured_at:  data.measured_at || now,
      weight_grams: data.weight_grams ? Number(data.weight_grams) : null,
      length_cm:    data.length_cm   ? Number(data.length_cm)    : null,
      notes:        data.notes || null,
    })

    // Also update the animal's current weight if this is newer
    if (data.weight_grams) {
      db.prepare(`
        UPDATE animals SET weight_grams = @w, updated_at = @now
        WHERE id = @id AND (weight_grams IS NULL OR updated_at <= @measured_at)
      `).run({ w: Number(data.weight_grams), now, id: animalId, measured_at: data.measured_at || now })
    }

    return db.prepare('SELECT * FROM measurements WHERE animal_id = ? ORDER BY measured_at DESC').all(animalId)
  })

  ipcMain.handle('measurements:delete', (_, id) => {
    getDb().prepare('DELETE FROM measurements WHERE id = ?').run(id)
    return { success: true }
  })
}

// ── Feedings ─────────────────────────────────────────────────────────────────

function registerFeedingHandlers(ipcMain) {
  ipcMain.handle('feedings:add', (_, animalId, data) => {
    const db  = getDb()
    const id  = uuidv4()

    db.prepare(`
      INSERT INTO feedings (id, animal_id, fed_at, prey_type, prey_size, prey_weight_grams, live, refused, notes)
      VALUES (@id, @animal_id, @fed_at, @prey_type, @prey_size, @prey_weight_grams, @live, @refused, @notes)
    `).run({
      id,
      animal_id:         animalId,
      fed_at:            data.fed_at || new Date().toISOString(),
      prey_type:         data.prey_type   || null,
      prey_size:         data.prey_size   || null,
      prey_weight_grams: data.prey_weight_grams ? Number(data.prey_weight_grams) : null,
      live:              data.live    ? 1 : 0,
      refused:           data.refused ? 1 : 0,
      notes:             data.notes   || null,
    })

    return db.prepare('SELECT * FROM feedings WHERE animal_id = ? ORDER BY fed_at DESC LIMIT 50').all(animalId)
  })

  ipcMain.handle('feedings:delete', (_, id) => {
    getDb().prepare('DELETE FROM feedings WHERE id = ?').run(id)
    return { success: true }
  })
}

// ── Photos ───────────────────────────────────────────────────────────────────

function getPhotoDir() {
  const { app } = require('electron')
  const base = app.isPackaged ? app.getPath('userData') : path.join(__dirname, '../../../')
  const dir  = path.join(base, 'animal-photos')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function registerPhotoHandlers(ipcMain, dialog) {
  ipcMain.handle('photos:choose', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose photos',
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'bmp'] }],
      properties: ['openFile', 'multiSelections'],
    })
    if (result.canceled) return []

    const photoDir = getPhotoDir()
    const saved    = []

    for (const filePath of result.filePaths) {
      const ext      = path.extname(filePath).toLowerCase()
      const filename = `${uuidv4()}${ext}`
      const dest     = path.join(photoDir, filename)
      fs.copyFileSync(filePath, dest)
      saved.push({ filename, original_name: path.basename(filePath), local_path: filePath })
    }

    return saved
  })

  ipcMain.handle('photos:save', (_, animalId, files) => {
    const db  = getDb()
    const now = new Date().toISOString()

    // Check if animal already has a primary photo
    const hasPrimary = db.prepare(
      'SELECT id FROM photos WHERE animal_id = ? AND is_primary = 1'
    ).get(animalId)

    const insertedIds = []

    for (let i = 0; i < files.length; i++) {
      const f          = files[i]
      const id         = uuidv4()
      const isPrimary  = !hasPrimary && i === 0 ? 1 : 0

      db.prepare(`
        INSERT INTO photos (id, animal_id, filename, original_name, is_primary, created_at)
        VALUES (@id, @animal_id, @filename, @original_name, @is_primary, @created_at)
      `).run({
        id,
        animal_id:     animalId,
        filename:      f.filename,
        original_name: f.original_name || f.filename,
        is_primary:    isPrimary,
        created_at:    now,
      })

      // Link primary photo back to animal record
      if (isPrimary) {
        db.prepare('UPDATE animals SET primary_photo_id = ?, updated_at = ? WHERE id = ?')
          .run(id, now, animalId)
      }

      insertedIds.push(id)
    }

    return db.prepare('SELECT * FROM photos WHERE animal_id = ? ORDER BY is_primary DESC, created_at').all(animalId)
  })

  ipcMain.handle('photos:setPrimary', (_, animalId, photoId) => {
    const db  = getDb()
    const now = new Date().toISOString()
    // Clear old primary
    db.prepare('UPDATE photos SET is_primary = 0 WHERE animal_id = ?').run(animalId)
    // Set new primary
    db.prepare('UPDATE photos SET is_primary = 1 WHERE id = ?').run(photoId)
    // Update animal record
    db.prepare('UPDATE animals SET primary_photo_id = ?, updated_at = ? WHERE id = ?').run(photoId, now, animalId)
    return { success: true }
  })

  ipcMain.handle('photos:getForAnimal', (_, animalId) => {
    return getDb().prepare(
      'SELECT * FROM photos WHERE animal_id = ? ORDER BY is_primary DESC, created_at'
    ).all(animalId)
  })

  ipcMain.handle('photos:getPath', (_, filename) => {
    return path.join(getPhotoDir(), filename)
  })

  ipcMain.handle('photos:delete', (_, photoId) => {
    const db    = getDb()
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId)
    if (!photo) return { success: false }

    // Remove file from disk
    try {
      const filePath = path.join(getPhotoDir(), photo.filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (e) { /* file may already be gone */ }

    db.prepare('DELETE FROM photos WHERE id = ?').run(photoId)

    // If we deleted the primary, promote the next photo
    if (photo.is_primary) {
      const next = db.prepare('SELECT id FROM photos WHERE animal_id = ? ORDER BY created_at LIMIT 1').get(photo.animal_id)
      if (next) {
        db.prepare('UPDATE photos SET is_primary = 1 WHERE id = ?').run(next.id)
        db.prepare('UPDATE animals SET primary_photo_id = ? WHERE id = ?').run(next.id, photo.animal_id)
      } else {
        db.prepare('UPDATE animals SET primary_photo_id = NULL WHERE id = ?').run(photo.animal_id)
      }
    }

    return { success: true }
  })
}

// ── Pairing events ────────────────────────────────────────────────────────────

function registerPairingEventHandlers(ipcMain) {
  ipcMain.handle('pairingEvents:add', (_, breedingId, data) => {
    const db  = getDb()
    const id  = uuidv4()

    db.prepare(`
      INSERT INTO pairing_events (id, breeding_record_id, paired_at, duration_minutes, lock_observed, notes)
      VALUES (@id, @breeding_record_id, @paired_at, @duration_minutes, @lock_observed, @notes)
    `).run({
      id,
      breeding_record_id: breedingId,
      paired_at:          data.paired_at || new Date().toISOString(),
      duration_minutes:   data.duration_minutes ? Number(data.duration_minutes) : null,
      lock_observed:      data.lock_observed ? 1 : 0,
      notes:              data.notes || null,
    })

    // Increment pairing count
    db.prepare(`
      UPDATE breeding_records
      SET pairing_count = pairing_count + 1,
          last_pairing_date = @date,
          updated_at = @now
      WHERE id = @id
    `).run({ id: breedingId, date: (data.paired_at || new Date().toISOString()).slice(0, 10), now: new Date().toISOString() })

    return db.prepare('SELECT * FROM pairing_events WHERE breeding_record_id = ? ORDER BY paired_at DESC').all(breedingId)
  })

  ipcMain.handle('pairingEvents:delete', (_, id) => {
    getDb().prepare('DELETE FROM pairing_events WHERE id = ?').run(id)
    return { success: true }
  })
}

// ── Offspring ─────────────────────────────────────────────────────────────────

function registerOffspringHandlers(ipcMain) {
  ipcMain.handle('offspring:getByClutch', (_, clutchId) => {
    return getDb().prepare(`
      SELECT o.*,
        a.name AS animal_name, a.animal_id AS linked_animal_id,
        a.status AS animal_status
      FROM offspring o
      LEFT JOIN animals a ON a.id = o.animal_id
      WHERE o.clutch_id = ?
      ORDER BY o.created_at
    `).all(clutchId)
  })

  ipcMain.handle('offspring:add', (_, clutchId, data) => {
    const db     = getDb()
    const id     = uuidv4()
    const now    = new Date().toISOString()
    const clutch = db.prepare('SELECT * FROM clutches WHERE id = ?').get(clutchId)
    if (!clutch) throw new Error('Clutch not found')

    db.prepare(`
      INSERT INTO offspring (id, clutch_id, breeding_record_id, animal_id, sex, hatch_date,
        hatch_weight_grams, disposition, sale_price, buyer_name, sale_date, notes, created_at)
      VALUES (@id, @clutch_id, @breeding_record_id, @animal_id, @sex, @hatch_date,
        @hatch_weight_grams, @disposition, @sale_price, @buyer_name, @sale_date, @notes, @created_at)
    `).run({
      id,
      clutch_id:          clutchId,
      breeding_record_id: clutch.breeding_record_id,
      animal_id:          data.animal_id         || null,
      sex:                data.sex               || 'unknown',
      hatch_date:         data.hatch_date        || clutch.hatch_date || null,
      hatch_weight_grams: data.hatch_weight_grams ? Number(data.hatch_weight_grams) : null,
      disposition:        data.disposition       || 'unknown',
      sale_price:         data.sale_price        ? Number(data.sale_price) : null,
      buyer_name:         data.buyer_name        || null,
      sale_date:          data.sale_date         || null,
      notes:              data.notes             || null,
      created_at:         now,
    })

    return getDb().prepare(`
      SELECT o.*, a.name AS animal_name, a.animal_id AS linked_animal_id
      FROM offspring o LEFT JOIN animals a ON a.id = o.animal_id
      WHERE o.clutch_id = ? ORDER BY o.created_at
    `).all(clutchId)
  })

  ipcMain.handle('offspring:update', (_, id, data) => {
    const db = getDb()
    const allowed = ['sex', 'hatch_date', 'hatch_weight_grams', 'disposition', 'sale_price', 'buyer_name', 'sale_date', 'notes', 'animal_id']
    const fields  = []
    const params  = { id }

    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = @${field}`)
        params[field] = data[field]
      }
    }
    if (fields.length) db.prepare(`UPDATE offspring SET ${fields.join(', ')} WHERE id = @id`).run(params)
    return db.prepare('SELECT * FROM offspring WHERE id = ?').get(id)
  })

  ipcMain.handle('offspring:delete', (_, id) => {
    getDb().prepare('DELETE FROM offspring WHERE id = ?').run(id)
    return { success: true }
  })
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function registerDashboardHandlers(ipcMain) {
  ipcMain.handle('dashboard:getSummary', () => {
    const db  = getDb()
    const now = new Date().toISOString()

    const collectionStats = db.prepare(`
      SELECT
        COUNT(*)                                      AS total,
        SUM(CASE WHEN sex = 'male'   THEN 1 ELSE 0 END) AS males,
        SUM(CASE WHEN sex = 'female' THEN 1 ELSE 0 END) AS females,
        COUNT(DISTINCT species_id)                    AS species_count
      FROM animals WHERE status = 'active'
    `).get()

    const breedingStats = db.prepare(`
      SELECT
        COUNT(*)                                               AS total,
        SUM(CASE WHEN status = 'active'  THEN 1 ELSE 0 END)  AS active,
        SUM(CASE WHEN status = 'gravid'  THEN 1 ELSE 0 END)  AS gravid,
        SUM(CASE WHEN status = 'laid'    THEN 1 ELSE 0 END)  AS laid,
        SUM(CASE WHEN status = 'hatched' THEN 1 ELSE 0 END)  AS hatched_season
      FROM breeding_records
      WHERE created_at >= date('now', '-1 year')
    `).get()

    const eggStats = db.prepare(`
      SELECT
        COALESCE(SUM(total_eggs), 0)    AS total_eggs,
        COALESCE(SUM(hatched_count), 0) AS total_hatched,
        COALESCE(SUM(slug_count), 0)    AS total_slugs
      FROM clutches
      WHERE created_at >= date('now', '-1 year')
    `).get()

    // Animals that haven't been weighed in 30+ days
    const needsWeighing = db.prepare(`
      SELECT a.id, a.name, a.species_id, s.common_name AS species_name,
             MAX(m.measured_at) AS last_weighed
      FROM animals a
      JOIN species s ON s.id = a.species_id
      LEFT JOIN measurements m ON m.animal_id = a.id
      WHERE a.status = 'active'
      GROUP BY a.id
      HAVING last_weighed IS NULL OR last_weighed < date('now', '-30 days')
      ORDER BY last_weighed ASC NULLS FIRST
      LIMIT 8
    `).all()

    // Animals that haven't been fed in 14+ days
    const needsFeeding = db.prepare(`
      SELECT a.id, a.name, a.species_id, s.common_name AS species_name,
             MAX(f.fed_at) AS last_fed
      FROM animals a
      JOIN species s ON s.id = a.species_id
      LEFT JOIN feedings f ON f.animal_id = a.id
      WHERE a.status = 'active'
      GROUP BY a.id
      HAVING last_fed IS NULL OR last_fed < date('now', '-14 days')
      ORDER BY last_fed ASC NULLS FIRST
      LIMIT 8
    `).all()

    // Active breeding records — upcoming milestones
    const activeBreeding = db.prepare(`
      SELECT br.*,
        m.name AS male_name, f.name AS female_name
      FROM breeding_records br
      JOIN animals m ON m.id = br.male_id
      JOIN animals f ON f.id = br.female_id
      WHERE br.status IN ('active', 'gravid', 'laid')
      ORDER BY COALESCE(br.first_pairing_date, br.created_at) DESC
      LIMIT 6
    `).all()

    // Recent clutches
    const recentClutches = db.prepare(`
      SELECT c.*, br.male_id, br.female_id,
        m.name AS male_name, f.name AS female_name
      FROM clutches c
      JOIN breeding_records br ON br.id = c.breeding_record_id
      JOIN animals m ON m.id = br.male_id
      JOIN animals f ON f.id = br.female_id
      ORDER BY c.lay_date DESC
      LIMIT 5
    `).all()

    // Recent animals added
    const recentAnimals = db.prepare(`
      SELECT a.*, s.common_name AS species_name, p.filename AS primary_photo_filename
      FROM animals a
      JOIN species s ON s.id = a.species_id
      LEFT JOIN photos p ON p.id = a.primary_photo_id
      ORDER BY a.created_at DESC
      LIMIT 6
    `).all()

    // Attach morphs to recent animals
    const getMorphs = db.prepare(`
      SELECT am.*, m.name AS morph_name, m.inheritance_type, m.has_health_concern
      FROM animal_morphs am JOIN morphs m ON m.id = am.morph_id
      WHERE am.animal_id = ? ORDER BY m.sort_order LIMIT 5
    `)
    for (const a of recentAnimals) {
      a.morphs = getMorphs.all(a.id)
    }

    return {
      collection: collectionStats,
      breeding:   { ...breedingStats, ...eggStats },
      needsWeighing,
      needsFeeding,
      activeBreeding,
      recentClutches,
      recentAnimals,
    }
  })
}

// ── Register all ─────────────────────────────────────────────────────────────

function register(ipcMain, dialog) {
  registerMeasurementHandlers(ipcMain)
  registerFeedingHandlers(ipcMain)
  registerPhotoHandlers(ipcMain, dialog)
  registerPairingEventHandlers(ipcMain)
  registerOffspringHandlers(ipcMain)
  registerDashboardHandlers(ipcMain)
}

module.exports = { register }
