'use strict'

const { v4: uuidv4 } = require('uuid')
const { getDb } = require('../database/db')

function register(ipcMain) {

  // ── Health issues ─────────────────────────────────────────────────────────

  ipcMain.handle('health:getForAnimal', (_, animalId) => {
    return getDb().prepare(`
      SELECT * FROM health_issues
      WHERE animal_id = ?
      ORDER BY
        CASE status WHEN 'active' THEN 0 WHEN 'monitoring' THEN 1 ELSE 2 END,
        CASE severity WHEN 'critical' THEN 0 WHEN 'serious' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END,
        onset_date DESC
    `).all(animalId)
  })

  ipcMain.handle('health:addIssue', (_, animalId, data) => {
    const db  = getDb()
    const id  = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO health_issues
        (id, animal_id, title, category, severity, status, onset_date, description, treatment, notes, created_at, updated_at)
      VALUES
        (@id, @animal_id, @title, @category, @severity, @status, @onset_date, @description, @treatment, @notes, @now, @now)
    `).run({
      id,
      animal_id:   animalId,
      title:       data.title,
      category:    data.category    || 'general',
      severity:    data.severity    || 'minor',
      status:      data.status      || 'active',
      onset_date:  data.onset_date  || null,
      description: data.description || null,
      treatment:   data.treatment   || null,
      notes:       data.notes       || null,
      now,
    })

    return db.prepare('SELECT * FROM health_issues WHERE id = ?').get(id)
  })

  ipcMain.handle('health:updateIssue', (_, id, data) => {
    const db      = getDb()
    const allowed = ['title','category','severity','status','onset_date','resolved_date','description','treatment','notes']
    const fields  = []
    const params  = { id, updated_at: new Date().toISOString() }

    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = @${field}`)
        params[field] = data[field]
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = @updated_at')
      db.prepare(`UPDATE health_issues SET ${fields.join(', ')} WHERE id = @id`).run(params)
    }

    return db.prepare('SELECT * FROM health_issues WHERE id = ?').get(id)
  })

  ipcMain.handle('health:deleteIssue', (_, id) => {
    getDb().prepare('DELETE FROM health_issues WHERE id = ?').run(id)
    return { success: true }
  })

  // ── Vet visits ────────────────────────────────────────────────────────────

  ipcMain.handle('health:getVetVisits', (_, animalId) => {
    return getDb().prepare(
      'SELECT * FROM vet_visits WHERE animal_id = ? ORDER BY visit_date DESC'
    ).all(animalId)
  })

  ipcMain.handle('health:addVetVisit', (_, animalId, data) => {
    const db  = getDb()
    const id  = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO vet_visits
        (id, animal_id, visit_date, vet_name, clinic_name, reason, diagnosis, treatment, follow_up_date, cost, notes, created_at)
      VALUES
        (@id, @animal_id, @visit_date, @vet_name, @clinic_name, @reason, @diagnosis, @treatment, @follow_up_date, @cost, @notes, @now)
    `).run({
      id,
      animal_id:      animalId,
      visit_date:     data.visit_date,
      vet_name:       data.vet_name       || null,
      clinic_name:    data.clinic_name    || null,
      reason:         data.reason,
      diagnosis:      data.diagnosis      || null,
      treatment:      data.treatment      || null,
      follow_up_date: data.follow_up_date || null,
      cost:           data.cost ? Number(data.cost) : null,
      notes:          data.notes          || null,
      now,
    })

    return db.prepare('SELECT * FROM vet_visits WHERE id = ?').get(id)
  })

  ipcMain.handle('health:updateVetVisit', (_, id, data) => {
    const db      = getDb()
    const allowed = ['visit_date','vet_name','clinic_name','reason','diagnosis','treatment','follow_up_date','cost','notes']
    const fields  = []
    const params  = { id }

    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = @${field}`)
        params[field] = data[field]
      }
    }

    if (fields.length > 0) {
      db.prepare(`UPDATE vet_visits SET ${fields.join(', ')} WHERE id = @id`).run(params)
    }

    return db.prepare('SELECT * FROM vet_visits WHERE id = ?').get(id)
  })

  ipcMain.handle('health:deleteVetVisit', (_, id) => {
    getDb().prepare('DELETE FROM vet_visits WHERE id = ?').run(id)
    return { success: true }
  })

  // ── Medications ───────────────────────────────────────────────────────────

  ipcMain.handle('health:getMedications', (_, animalId) => {
    return getDb().prepare(
      'SELECT * FROM medications WHERE animal_id = ? ORDER BY active DESC, start_date DESC'
    ).all(animalId)
  })

  ipcMain.handle('health:addMedication', (_, animalId, data) => {
    const db  = getDb()
    const id  = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO medications
        (id, animal_id, name, dosage, frequency, route, start_date, end_date, prescribed_by, reason, active, notes, created_at)
      VALUES
        (@id, @animal_id, @name, @dosage, @frequency, @route, @start_date, @end_date, @prescribed_by, @reason, @active, @notes, @now)
    `).run({
      id,
      animal_id:    animalId,
      name:         data.name,
      dosage:       data.dosage       || null,
      frequency:    data.frequency    || null,
      route:        data.route        || null,
      start_date:   data.start_date   || null,
      end_date:     data.end_date     || null,
      prescribed_by:data.prescribed_by|| null,
      reason:       data.reason       || null,
      active:       data.active !== false ? 1 : 0,
      notes:        data.notes        || null,
      now,
    })

    return db.prepare('SELECT * FROM medications WHERE id = ?').get(id)
  })

  ipcMain.handle('health:updateMedication', (_, id, data) => {
    const db      = getDb()
    const allowed = ['name','dosage','frequency','route','start_date','end_date','prescribed_by','reason','active','notes']
    const fields  = []
    const params  = { id }

    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = @${field}`)
        params[field] = data[field]
      }
    }

    if (fields.length > 0) {
      db.prepare(`UPDATE medications SET ${fields.join(', ')} WHERE id = @id`).run(params)
    }

    return db.prepare('SELECT * FROM medications WHERE id = ?').get(id)
  })

  ipcMain.handle('health:deleteMedication', (_, id) => {
    getDb().prepare('DELETE FROM medications WHERE id = ?').run(id)
    return { success: true }
  })

  // ── Health summary (for dashboard) ───────────────────────────────────────

  ipcMain.handle('health:getSummaryForAnimal', (_, animalId) => {
    const db = getDb()

    const issues      = db.prepare('SELECT * FROM health_issues WHERE animal_id = ? AND status != ? ORDER BY created_at DESC').all(animalId, 'resolved')
    const medications = db.prepare('SELECT * FROM medications WHERE animal_id = ? AND active = 1').all(animalId)
    const vetVisits   = db.prepare('SELECT * FROM vet_visits WHERE animal_id = ? ORDER BY visit_date DESC LIMIT 3').all(animalId)
    const measurements = db.prepare('SELECT * FROM measurements WHERE animal_id = ? ORDER BY measured_at DESC LIMIT 30').all(animalId)
    const feedings    = db.prepare('SELECT * FROM feedings WHERE animal_id = ? ORDER BY fed_at DESC LIMIT 20').all(animalId)

    return { issues, medications, vetVisits, measurements, feedings }
  })

  // ── All animals health overview (for Health page list) ───────────────────

  ipcMain.handle('health:getAllAnimalsOverview', () => {
    const db = getDb()

    const animals = db.prepare(`
      SELECT a.*, s.common_name AS species_name, p.filename AS primary_photo_filename,
        (SELECT COUNT(*) FROM health_issues hi WHERE hi.animal_id = a.id AND hi.status != 'resolved') AS active_issues,
        (SELECT COUNT(*) FROM medications m WHERE m.animal_id = a.id AND m.active = 1) AS active_meds,
        (SELECT MAX(measured_at) FROM measurements me WHERE me.animal_id = a.id) AS last_weighed,
        (SELECT weight_grams FROM measurements me WHERE me.animal_id = a.id ORDER BY measured_at DESC LIMIT 1) AS latest_weight,
        (SELECT MAX(fed_at) FROM feedings f WHERE f.animal_id = a.id) AS last_fed
      FROM animals a
      JOIN species s ON s.id = a.species_id
      LEFT JOIN photos p ON p.id = a.primary_photo_id
      WHERE a.status = 'active'
      ORDER BY a.name
    `).all()

    return animals
  })
}

module.exports = { register }
