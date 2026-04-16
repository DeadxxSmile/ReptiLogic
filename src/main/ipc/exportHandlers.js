'use strict'

const path = require('path')
const fs   = require('fs')
const { getDb } = require('../database/db')

// ── CSV helpers ───────────────────────────────────────────────────────────────

function escape(val) {
  if (val == null) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toCsv(rows, columns) {
  const header = columns.map(c => c.label).join(',')
  const lines  = rows.map(row =>
    columns.map(c => escape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',')
  )
  return [header, ...lines].join('\r\n')
}

function writeCsv(folderPath, filename, content) {
  const fullPath = path.join(folderPath, filename)
  fs.writeFileSync(fullPath, '\uFEFF' + content, 'utf8') // BOM for Excel
  return fullPath
}

// ── Export handlers ───────────────────────────────────────────────────────────

function registerExportHandlers(ipcMain, dialog) {
  ipcMain.handle('export:chooseFolder', async () => {
    const result = await dialog.showOpenDialog({
      title:      'Choose export folder',
      properties: ['openDirectory', 'createDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Collection CSV ─────────────────────────────────────────────────────────
  ipcMain.handle('export:collectionCsv', (_, folderPath) => {
    const db = getDb()

    const animals = db.prepare(`
      SELECT a.*, s.common_name AS species_name
      FROM animals a JOIN species s ON s.id = a.species_id
      ORDER BY s.common_name, a.name
    `).all()

    // Attach morph summary to each animal
    const getMorphs = db.prepare(`
      SELECT m.name, am.expression, am.het_percent
      FROM animal_morphs am JOIN morphs m ON m.id = am.morph_id
      WHERE am.animal_id = ? ORDER BY m.sort_order
    `)

    for (const a of animals) {
      const morphs = getMorphs.all(a.id)
      a.morphs_summary = morphs.map(m => {
        if (m.expression === 'visual')       return m.name
        if (m.expression === 'het')          return `Het ${m.name}`
        if (m.expression === 'possible_het') return `${m.het_percent || 50}% Poss Het ${m.name}`
        if (m.expression === 'proven_het')   return `Proven Het ${m.name}`
        if (m.expression === 'super')        return `Super ${m.name}`
        return m.name
      }).join('; ')
    }

    const columns = [
      { label: 'Name',             key: 'name' },
      { label: 'Species',          key: 'species_name' },
      { label: 'Sex',              key: 'sex' },
      { label: 'DOB',              key: 'dob' },
      { label: 'DOB Estimated',    value: r => r.dob_estimated ? 'Yes' : 'No' },
      { label: 'Weight (g)',       key: 'weight_grams' },
      { label: 'Status',           key: 'status' },
      { label: 'Acquired Date',    key: 'acquired_date' },
      { label: 'Acquired From',    key: 'acquired_from' },
      { label: 'Purchase Price',   key: 'acquisition_price' },
      { label: 'Morphs',           key: 'morphs_summary' },
      { label: 'Notes',            key: 'notes' },
      { label: 'Added',            key: 'created_at' },
    ]

    const csv  = toCsv(animals, columns)
    const file = writeCsv(folderPath, 'collection.csv', csv)
    return { success: true, path: file, count: animals.length }
  })

  // Breeding CSV ────────────────────────────────────────────────────────────
  ipcMain.handle('export:breedingCsv', (_, folderPath) => {
    const db = getDb()

    const records = db.prepare(`
      SELECT br.*,
        m.name AS male_name, f.name AS female_name,
        s.common_name AS species_name
      FROM breeding_records br
      JOIN animals m ON m.id = br.male_id
      JOIN animals f ON f.id = br.female_id
      JOIN species s ON s.id = br.species_id
      ORDER BY br.created_at DESC
    `).all()

    const columns = [
      { label: 'Male',              key: 'male_name' },
      { label: 'Female',            key: 'female_name' },
      { label: 'Species',           key: 'species_name' },
      { label: 'Status',            key: 'status' },
      { label: 'First Pairing',     key: 'first_pairing_date' },
      { label: 'Last Pairing',      key: 'last_pairing_date' },
      { label: 'Lock Date',         key: 'lock_date' },
      { label: 'Ovulation Date',    key: 'confirmed_ovulation_date' },
      { label: 'Pre-lay Shed',      key: 'pre_lay_shed_date' },
      { label: 'Pairing Count',     key: 'pairing_count' },
      { label: 'Total Eggs',        key: 'total_eggs' },
      { label: 'Fertile Eggs',      key: 'fertile_eggs' },
      { label: 'Slugs',             key: 'slug_count' },
      { label: 'Hatched',           key: 'hatched_count' },
      { label: 'Notes',             key: 'notes' },
    ]

    const csv  = toCsv(records, columns)
    const file = writeCsv(folderPath, 'breeding_records.csv', csv)
    return { success: true, path: file, count: records.length }
  })

  // Full backup ─────────────────────────────────────────────────────────────
  ipcMain.handle('export:fullBackup', async (_, folderPath) => {
    const db = getDb()
    const stamp = new Date().toISOString().slice(0, 10)
    const dest = path.join(folderPath, `reptilogic-backup-${stamp}.db`)

    // Use SQLite's backup API so WAL mode databases are copied safely while the app is running.
    await db.backup(dest)

    return { success: true, path: dest }
  })
}

// ── Settings handlers ─────────────────────────────────────────────────────────

function registerSettingsHandlers(ipcMain) {
  ipcMain.handle('settings:getAll', () => {
    const rows = getDb().prepare('SELECT key, value FROM app_settings').all()
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  })

  ipcMain.handle('settings:set', (_, key, value) => {
    const db  = getDb()
    const now = new Date().toISOString()
    db.prepare(`
      INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, String(value), now)
    return { success: true }
  })
}

function register(ipcMain, dialog) {
  registerExportHandlers(ipcMain, dialog)
  registerSettingsHandlers(ipcMain)
}

module.exports = { register }
