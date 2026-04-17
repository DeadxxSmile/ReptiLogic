'use strict'

const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const dbModule = require('../database/db')
const { getDb, getDbPath } = dbModule

function escape(val) {
  if (val == null) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function normalizeText(value) {
  const text = String(value || '').trim()
  return text || null
}

function toCsv(rows, columns) {
  const header = columns.map(c => c.label).join(',')
  const lines = rows.map(row =>
    columns.map(c => escape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',')
  )
  return [header, ...lines].join('\r\n')
}

function writeCsv(folderPath, filename, content) {
  const fullPath = path.join(folderPath, filename)
  fs.writeFileSync(fullPath, '\uFEFF' + content, 'utf8')
  return fullPath
}

function getResourcePath(...parts) {
  return path.join(__dirname, '../../../resources', ...parts)
}

function normalizeHeader(header) {
  return String(header || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        value += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        value += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(value)
      value = ''
    } else if (char === '\n') {
      row.push(value.replace(/\r$/, ''))
      rows.push(row)
      row = []
      value = ''
    } else {
      value += char
    }
  }

  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ''))
    rows.push(row)
  }

  if (!rows.length) return []
  const headers = rows.shift().map(normalizeHeader)

  return rows
    .filter(r => r.some(cell => String(cell || '').trim() !== ''))
    .map(values => {
      const record = {}
      headers.forEach((header, index) => {
        record[header] = values[index] != null ? String(values[index]).trim() : ''
      })
      return record
    })
}

function parseBoolean(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['yes', 'y', 'true', '1'].includes(normalized)
}

function parseNumber(value) {
  const normalized = String(value || '').trim().replace(/[$,]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeSex(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (['m', 'male', 'boy'].includes(normalized)) return 'male'
  if (['f', 'female', 'girl'].includes(normalized)) return 'female'
  return 'unknown'
}

function normalizeAnimalStatus(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_')
  const valid = new Set(['active', 'sold', 'deceased', 'on_loan'])
  return valid.has(normalized) ? normalized : 'active'
}

function normalizeBreedingStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()
  const valid = new Set(['planned', 'active', 'gravid', 'laid', 'hatched', 'failed', 'cancelled'])
  return valid.has(normalized) ? normalized : 'planned'
}

function normalizeInheritance(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const valid = new Set(['recessive', 'co_dominant', 'dominant', 'line_bred', 'polygenetic'])
  return valid.has(normalized) ? normalized : null
}

function normalizeDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function splitMorphSummary(summary) {
  return String(summary || '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
}

function resolveSpeciesId(db, value) {
  const normalized = String(value || '').trim()
  if (!normalized) return null

  const byId = db.prepare('SELECT id FROM species WHERE id = ?').get(normalized)
  if (byId) return byId.id

  const byName = db.prepare('SELECT id FROM species WHERE lower(common_name) = lower(?)').get(normalized)
  if (byName) return byName.id

  return null
}

function resolveMorphMap(db, speciesId) {
  const rows = db.prepare(`
    SELECT id, name, also_known_as, super_form_name
    FROM morphs
    WHERE species_id = ?
  `).all(speciesId)

  const map = new Map()
  for (const row of rows) {
    map.set(row.name.toLowerCase(), row)
    if (row.super_form_name) map.set(String(row.super_form_name).toLowerCase(), row)
    if (row.also_known_as) {
      for (const alias of String(row.also_known_as).split(',')) {
        const cleaned = alias.trim().toLowerCase()
        if (cleaned) map.set(cleaned, row)
      }
    }
  }
  return map
}

function parseMorphExpression(entry, morphMap) {
  let raw = String(entry || '').trim()
  if (!raw) return null

  let expression = 'visual'
  let hetPercent = null

  if (/^proven\s+het\s+/i.test(raw)) {
    expression = 'proven_het'
    raw = raw.replace(/^proven\s+het\s+/i, '')
  } else {
    const poss = raw.match(/^(\d+)%\s+poss\s+het\s+/i)
    if (poss) {
      expression = 'possible_het'
      hetPercent = Number(poss[1])
      raw = raw.replace(/^(\d+)%\s+poss\s+het\s+/i, '')
    } else if (/^het\s+/i.test(raw)) {
      expression = 'het'
      raw = raw.replace(/^het\s+/i, '')
    } else if (/^super\s+/i.test(raw)) {
      expression = 'super'
      raw = raw.replace(/^super\s+/i, '')
    }
  }

  const lookup = morphMap.get(raw.toLowerCase())
  if (!lookup) return { missing: raw }

  return {
    morph_id: lookup.id,
    expression,
    het_percent: hetPercent,
    confirmed: expression !== 'possible_het',
  }
}

function importCollectionCsv(filePath) {
  const db = getDb()
  const rows = parseCsv(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''))
  if (!rows.length) throw new Error('The selected CSV file does not contain any data rows.')

  const errors = []
  let imported = 0

  const insertAnimal = db.prepare(`
    INSERT INTO animals (
      id, species_id, animal_id, name, sex, dob, dob_estimated,
      weight_grams, acquired_date, acquired_from,
      acquisition_price, status, notes, created_at, updated_at
    ) VALUES (
      @id, @species_id, @animal_id, @name, @sex, @dob, @dob_estimated,
      @weight_grams, @acquired_date, @acquired_from,
      @acquisition_price, @status, @notes, @created_at, @updated_at
    )
  `)

  const insertMorph = db.prepare(`
    INSERT OR IGNORE INTO animal_morphs (id, animal_id, morph_id, expression, het_percent, confirmed, notes)
    VALUES (@id, @animal_id, @morph_id, @expression, @het_percent, @confirmed, @notes)
  `)

  const tx = db.transaction(() => {
    for (const [index, row] of rows.entries()) {
      const rowNum = index + 2
      const speciesId = resolveSpeciesId(db, row.species || row.species_id)
      const name = String(row.name || '').trim()

      if (!name) {
        errors.push(`Row ${rowNum}: missing Name`)
        continue
      }
      if (!speciesId) {
        errors.push(`Row ${rowNum}: unknown Species "${row.species || row.species_id || ''}"`)
        continue
      }

      const duplicate = db.prepare('SELECT id FROM animals WHERE lower(name) = lower(?) AND species_id = ?').get(name, speciesId)
      if (duplicate) {
        errors.push(`Row ${rowNum}: skipped duplicate animal "${name}" for species ${row.species || speciesId}`)
        continue
      }

      const id = uuidv4()
      const now = new Date().toISOString()

      // Handle animal_id — if provided use it, else auto-generate
      let animalId = normalizeText(row.animal_id)
      if (!animalId) {
        // Auto-generate using same logic as backend handler
        const speciesCode = speciesId.split('_').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 3)
        const sexCode = normalizeSex(row.sex) === 'male' ? 'M' : normalizeSex(row.sex) === 'female' ? 'F' : 'U'
        db.prepare(`INSERT INTO animal_id_counters (species_id, sex, counter) VALUES (?,?,1) ON CONFLICT(species_id,sex) DO UPDATE SET counter=counter+1`).run(speciesId, normalizeSex(row.sex))
        const cRow = db.prepare('SELECT counter FROM animal_id_counters WHERE species_id=? AND sex=?').get(speciesId, normalizeSex(row.sex))
        animalId = `${speciesCode}${sexCode}${String(cRow?.counter || 1).padStart(3, '0')}`
      }

      insertAnimal.run({
        id,
        species_id: speciesId,
        animal_id:  animalId,
        name,
        sex: normalizeSex(row.sex),
        dob: normalizeDate(row.dob),
        dob_estimated: parseBoolean(row.dob_estimated) ? 1 : 0,
        weight_grams: parseNumber(row.weight_g || row.weight_grams),
        acquired_date: normalizeDate(row.acquired_date),
        acquired_from: String(row.acquired_from || '').trim() || null,
        acquisition_price: parseNumber(row.purchase_price || row.acquisition_price),
        status: normalizeAnimalStatus(row.status),
        notes: normalizeText(row.notes),
        created_at: now,
        updated_at: now,
      })

      const morphSummary = row.morphs || row.morphs_summary
      if (morphSummary) {
        const morphMap = resolveMorphMap(db, speciesId)
        for (const part of splitMorphSummary(morphSummary)) {
          const parsed = parseMorphExpression(part, morphMap)
          if (!parsed) continue
          if (parsed.missing) {
            errors.push(`Row ${rowNum}: morph "${parsed.missing}" was not found for ${row.species || speciesId}`)
            continue
          }
          insertMorph.run({
            id: uuidv4(),
            animal_id: id,
            morph_id: parsed.morph_id,
            expression: parsed.expression,
            het_percent: parsed.het_percent,
            confirmed: parsed.confirmed ? 1 : 0,
            notes: null,
          })
        }
      }

      imported += 1
    }
  })

  tx()
  return { success: true, imported, errors, path: filePath, message: `Imported collection CSV from ${path.basename(filePath)}` }
}

function importBreedingCsv(filePath) {
  const db = getDb()
  const rows = parseCsv(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''))
  if (!rows.length) throw new Error('The selected breeding CSV does not contain any data rows.')

  const errors = []
  let imported = 0
  const tx = db.transaction(() => {
    for (const [index, row] of rows.entries()) {
      const rowNum = index + 2
      const speciesId = resolveSpeciesId(db, row.species || row.species_name)
      if (!speciesId) {
        errors.push(`Row ${rowNum}: unknown species "${row.species || row.species_name || ''}"`)
        continue
      }

      const male = db.prepare('SELECT id FROM animals WHERE species_id = ? AND lower(name) = lower(?)').get(speciesId, row.male || row.male_name || '')
      const female = db.prepare('SELECT id FROM animals WHERE species_id = ? AND lower(name) = lower(?)').get(speciesId, row.female || row.female_name || '')
      if (!male || !female) {
        errors.push(`Row ${rowNum}: could not match male/female animals in your collection`)
        continue
      }

      const firstPairing = normalizeDate(row.first_pairing || row.first_pairing_date)
      const lastPairing = normalizeDate(row.last_pairing || row.last_pairing_date)
      const duplicate = db.prepare(`
        SELECT id FROM breeding_records
        WHERE species_id = ? AND male_id = ? AND female_id = ?
          AND coalesce(first_pairing_date,'') = coalesce(?, '')
          AND coalesce(last_pairing_date,'') = coalesce(?, '')
      `).get(speciesId, male.id, female.id, firstPairing, lastPairing)
      if (duplicate) {
        errors.push(`Row ${rowNum}: skipped duplicate breeding record for ${row.male || row.male_name} x ${row.female || row.female_name}`)
        continue
      }

      const now = new Date().toISOString()
      db.prepare(`
        INSERT INTO breeding_records (
          id, species_id, male_id, female_id, first_pairing_date, last_pairing_date,
          lock_date, confirmed_ovulation_date, pre_lay_shed_date, status, pairing_count,
          total_eggs, fertile_eggs, slug_count, hatched_count, notes, created_at, updated_at
        ) VALUES (
          @id, @species_id, @male_id, @female_id, @first_pairing_date, @last_pairing_date,
          @lock_date, @confirmed_ovulation_date, @pre_lay_shed_date, @status, @pairing_count,
          @total_eggs, @fertile_eggs, @slug_count, @hatched_count, @notes, @created_at, @updated_at
        )
      `).run({
        id: uuidv4(),
        species_id: speciesId,
        male_id: male.id,
        female_id: female.id,
        first_pairing_date: firstPairing,
        last_pairing_date: lastPairing,
        lock_date: normalizeDate(row.lock_date),
        confirmed_ovulation_date: normalizeDate(row.ovulation_date || row.confirmed_ovulation_date),
        pre_lay_shed_date: normalizeDate(row.pre_lay_shed || row.pre_lay_shed_date),
        status: normalizeBreedingStatus(row.status),
        pairing_count: parseNumber(row.pairing_count) || 0,
        total_eggs: parseNumber(row.total_eggs),
        fertile_eggs: parseNumber(row.fertile_eggs),
        slug_count: parseNumber(row.slugs || row.slug_count) || 0,
        hatched_count: parseNumber(row.hatched || row.hatched_count),
        notes: normalizeText(row.notes),
        created_at: now,
        updated_at: now,
      })

      imported += 1
    }
  })
  tx()
  return { success: true, imported, errors, path: filePath, message: `Imported breeding CSV from ${path.basename(filePath)}` }
}

function importMorphsCsv(filePath) {
  const db = getDb()
  const rows = parseCsv(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''))
  if (!rows.length) throw new Error('The selected morph CSV does not contain any data rows.')

  const errors = []
  let imported = 0
  let updated = 0

  const tx = db.transaction(() => {
    for (const [index, row] of rows.entries()) {
      const rowNum = index + 2
      const speciesId = resolveSpeciesId(db, row.species || row.species_name || row.species_id)
      const name = String(row.name || '').trim()
      const inheritanceType = normalizeInheritance(row.inheritance || row.inheritance_type)
      if (!speciesId) {
        errors.push(`Row ${rowNum}: unknown species "${row.species || row.species_name || row.species_id || ''}"`)
        continue
      }
      if (!name) {
        errors.push(`Row ${rowNum}: missing morph name`)
        continue
      }
      if (!inheritanceType) {
        errors.push(`Row ${rowNum}: invalid inheritance type for "${name}"`)
        continue
      }

      const payload = {
        species_id: speciesId,
        name,
        gene_symbol: normalizeText(row.gene_symbol),
        category: normalizeText(row.category),
        inheritance_type: inheritanceType,
        super_form_name: normalizeText(row.super_form_name),
        allele_group_id: normalizeText(row.allele_group || row.allele_group_id),
        cross_allele_result: normalizeText(row.cross_allele_result),
        is_sex_linked: parseBoolean(row.is_sex_linked) ? 1 : 0,
        has_health_concern: parseBoolean(row.has_health_concern) ? 1 : 0,
        health_concern_desc: normalizeText(row.health_concern_desc),
        description: normalizeText(row.description),
        also_known_as: normalizeText(row.also_known_as),
        discovered_year: parseNumber(row.discovered_year),
        is_combo: parseBoolean(row.is_combo) ? 1 : 0,
        combo_components: normalizeText(row.combo_components),
        sort_order: parseNumber(row.sort_order) ?? 999,
      }

      const existing = db.prepare('SELECT id FROM morphs WHERE species_id = ? AND lower(name) = lower(?)').get(speciesId, name)
      if (existing) {
        db.prepare(`
          UPDATE morphs SET
            gene_symbol = @gene_symbol,
            category = @category,
            inheritance_type = @inheritance_type,
            super_form_name = @super_form_name,
            allele_group_id = @allele_group_id,
            cross_allele_result = @cross_allele_result,
            is_sex_linked = @is_sex_linked,
            has_health_concern = @has_health_concern,
            health_concern_desc = @health_concern_desc,
            description = @description,
            also_known_as = @also_known_as,
            discovered_year = @discovered_year,
            is_combo = @is_combo,
            combo_components = @combo_components,
            sort_order = @sort_order,
            is_user_created = 1
          WHERE id = @id
        `).run({ ...payload, id: existing.id })
        updated += 1
      } else {
        db.prepare(`
          INSERT INTO morphs (
            id, species_id, name, gene_symbol, category, inheritance_type,
            super_form_name, allele_group_id, cross_allele_result, is_sex_linked,
            has_health_concern, health_concern_desc, description,
            also_known_as, discovered_year, is_combo, combo_components, sort_order, is_user_created
          ) VALUES (
            @id, @species_id, @name, @gene_symbol, @category, @inheritance_type,
            @super_form_name, @allele_group_id, @cross_allele_result, @is_sex_linked,
            @has_health_concern, @health_concern_desc, @description,
            @also_known_as, @discovered_year, @is_combo, @combo_components, @sort_order, 1
          )
        `).run({ ...payload, id: uuidv4() })
        imported += 1
      }
    }
  })
  tx()
  return {
    success: true,
    imported: imported + updated,
    errors,
    path: filePath,
    message: `Imported morph CSV from ${path.basename(filePath)}${updated ? ` (${updated} updated)` : ''}`,
  }
}

function importFullBackup(filePath) {
  const sourcePath = path.resolve(filePath)
  const destPath = getDbPath()
  const liveDb = getDb()

  if (!fs.existsSync(sourcePath)) throw new Error('The selected backup file could not be found.')

  liveDb.pragma('wal_checkpoint(TRUNCATE)')
  dbModule.close()

  for (const suffix of ['', '-wal', '-shm']) {
    const target = `${destPath}${suffix}`
    if (fs.existsSync(target)) fs.rmSync(target, { force: true })
  }

  fs.copyFileSync(sourcePath, destPath)
  dbModule.initialize()

  return { success: true, path: destPath, restartedConnection: true, message: `Restored full backup from ${path.basename(filePath)}` }
}

function detectImportType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.db') return 'full'
  if (ext !== '.csv') throw new Error('Choose a .csv or .db file exported by ReptiLogic.')

  const rows = parseCsv(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''))
  if (!rows.length) throw new Error('The selected CSV file does not contain any data rows.')
  const keys = new Set(Object.keys(rows[0]))
  if (keys.has('male') || keys.has('male_name') || keys.has('female') || keys.has('female_name')) return 'breeding'
  if (keys.has('inheritance_type') || keys.has('inheritance') || keys.has('gene_symbol')) return 'morphs'
  return 'collection'
}

function registerExportHandlers(ipcMain, dialog) {
  ipcMain.handle('export:chooseFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose export folder',
      properties: ['openDirectory', 'createDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('export:collectionCsv', (_, folderPath) => {
    const db = getDb()
    const animals = db.prepare(`
      SELECT a.*, s.common_name AS species_name,
             fa.name AS father_name, ma.name AS mother_name
      FROM animals a
      JOIN species s ON s.id = a.species_id
      LEFT JOIN animals fa ON fa.id = a.father_id
      LEFT JOIN animals ma ON ma.id = a.mother_id
      ORDER BY s.common_name, a.name
    `).all()

    const getMorphs = db.prepare(`
      SELECT m.name, am.expression, am.het_percent
      FROM animal_morphs am JOIN morphs m ON m.id = am.morph_id
      WHERE am.animal_id = ? ORDER BY m.sort_order
    `)

    for (const a of animals) {
      const morphs = getMorphs.all(a.id)
      a.morphs_summary = morphs.map(m => {
        if (m.expression === 'visual') return m.name
        if (m.expression === 'het') return `Het ${m.name}`
        if (m.expression === 'possible_het') return `${m.het_percent || 50}% Poss Het ${m.name}`
        if (m.expression === 'proven_het') return `Proven Het ${m.name}`
        if (m.expression === 'super') return `Super ${m.name}`
        return m.name
      }).join('; ')
    }

    const columns = [
      { label: 'Animal ID',     key: 'animal_id' },
      { label: 'Name',          key: 'name' },
      { label: 'Species',       key: 'species_name' },
      { label: 'Sex',           key: 'sex' },
      { label: 'DOB',           key: 'dob' },
      { label: 'DOB Estimated', value: r => r.dob_estimated ? 'Yes' : 'No' },
      { label: 'Weight (g)',    key: 'weight_grams' },
      { label: 'Status',        key: 'status' },
      { label: 'Acquired Date', key: 'acquired_date' },
      { label: 'Acquired From', key: 'acquired_from' },
      { label: 'Purchase Price',key: 'acquisition_price' },
      { label: 'Father Name',   key: 'father_name' },
      { label: 'Mother Name',   key: 'mother_name' },
      { label: 'Morphs',        key: 'morphs_summary' },
      { label: 'Notes',         key: 'notes' },
      { label: 'Added',         key: 'created_at' },
    ]

    const file = writeCsv(folderPath, 'collection.csv', toCsv(animals, columns))
    return { success: true, path: file, count: animals.length }
  })

  ipcMain.handle('export:breedingCsv', (_, folderPath) => {
    const db = getDb()
    const records = db.prepare(`
      SELECT br.*, m.name AS male_name, f.name AS female_name, s.common_name AS species_name
      FROM breeding_records br
      JOIN animals m ON m.id = br.male_id
      JOIN animals f ON f.id = br.female_id
      JOIN species s ON s.id = br.species_id
      ORDER BY br.created_at DESC
    `).all()

    const columns = [
      { label: 'Male', key: 'male_name' },
      { label: 'Female', key: 'female_name' },
      { label: 'Species', key: 'species_name' },
      { label: 'Status', key: 'status' },
      { label: 'First Pairing', key: 'first_pairing_date' },
      { label: 'Last Pairing', key: 'last_pairing_date' },
      { label: 'Lock Date', key: 'lock_date' },
      { label: 'Ovulation Date', key: 'confirmed_ovulation_date' },
      { label: 'Pre-lay Shed', key: 'pre_lay_shed_date' },
      { label: 'Pairing Count', key: 'pairing_count' },
      { label: 'Total Eggs', key: 'total_eggs' },
      { label: 'Fertile Eggs', key: 'fertile_eggs' },
      { label: 'Slugs', key: 'slug_count' },
      { label: 'Hatched', key: 'hatched_count' },
      { label: 'Notes', key: 'notes' },
    ]

    const file = writeCsv(folderPath, 'breeding_records.csv', toCsv(records, columns))
    return { success: true, path: file, count: records.length }
  })

  ipcMain.handle('export:morphsCsv', (_, folderPath) => {
    const db = getDb()
    const rows = db.prepare(`
      SELECT m.*, s.common_name AS species_name
      FROM morphs m
      JOIN species s ON s.id = m.species_id
      ORDER BY s.common_name, m.sort_order, m.name
    `).all()

    const columns = [
      { label: 'Name',               key: 'name' },
      { label: 'Species',            key: 'species_name' },
      { label: 'Gene Symbol',        key: 'gene_symbol' },
      { label: 'Category',           key: 'category' },
      { label: 'Inheritance Type',   key: 'inheritance_type' },
      { label: 'Super Form Name',    key: 'super_form_name' },
      { label: 'Is Sex Linked',      value: r => r.is_sex_linked ? 'Yes' : 'No' },
      { label: 'Allele Group',       key: 'allele_group_id' },
      { label: 'Cross Allele Result', key: 'cross_allele_result' },
      { label: 'Has Health Concern', value: r => r.has_health_concern ? 'Yes' : 'No' },
      { label: 'Health Concern Desc', key: 'health_concern_desc' },
      { label: 'Description',        key: 'description' },
      { label: 'Also Known As',      key: 'also_known_as' },
      { label: 'Discovered Year',    key: 'discovered_year' },
      { label: 'Is Combo',           value: r => r.is_combo ? 'Yes' : 'No' },
      { label: 'Combo Components',   key: 'combo_components' },
      { label: 'Sort Order',         key: 'sort_order' },
      { label: 'User Created',       value: r => r.is_user_created ? 'Yes' : 'No' },
    ]

    const file = writeCsv(folderPath, 'morphs.csv', toCsv(rows, columns))
    return { success: true, path: file, count: rows.length }
  })

  ipcMain.handle('export:fullBackup', async (_, folderPath) => {
    const db = getDb()
    const stamp = new Date().toISOString().slice(0, 10)
    const dest = path.join(folderPath, `reptilogic-backup-${stamp}.db`)
    await db.backup(dest)
    return { success: true, path: dest }
  })

  ipcMain.handle('export:importTemplateCsv', (_, folderPath) => {
    const source = getResourcePath('templates', 'collection-import-template.csv')
    const target = path.join(folderPath, 'collection-import-template.csv')
    fs.copyFileSync(source, target)
    return { success: true, path: target }
  })
}

function registerImportHandlers(ipcMain, dialog) {
  ipcMain.handle('import:chooseCsvFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose collection CSV file',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      properties: ['openFile'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('import:chooseImportFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose ReptiLogic export file',
      filters: [
        { name: 'ReptiLogic exports', extensions: ['csv', 'db'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'SQLite Database', extensions: ['db'] },
      ],
      properties: ['openFile'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('import:collectionCsv', (_, filePath) => importCollectionCsv(filePath))
  ipcMain.handle('import:breedingCsv', (_, filePath) => importBreedingCsv(filePath))
  ipcMain.handle('import:morphsCsv', (_, filePath) => importMorphsCsv(filePath))
  ipcMain.handle('import:fullBackup', (_, filePath) => importFullBackup(filePath))
  ipcMain.handle('import:restoreAny', (_, filePath) => {
    const type = detectImportType(filePath)
    if (type === 'full') return importFullBackup(filePath)
    if (type === 'breeding') return importBreedingCsv(filePath)
    if (type === 'morphs') return importMorphsCsv(filePath)
    return importCollectionCsv(filePath)
  })
}

function registerSettingsHandlers(ipcMain) {
  ipcMain.handle('settings:getAll', () => {
    const rows = getDb().prepare('SELECT key, value FROM app_settings').all()
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  })

  ipcMain.handle('settings:set', (_, key, value) => {
    const db = getDb()
    const now = new Date().toISOString()

    // Intercept species upsert (from Animal Library page)
    if (key === '_species_upsert') {
      try {
        const data = JSON.parse(value)
        db.prepare(`
          INSERT INTO species (
            id, common_name, scientific_name, gives_live_birth,
            avg_clutch_size, litter_size_min, litter_size_max,
            incubation_days_min, incubation_days_max, notes, created_at
          ) VALUES (
            @id, @common_name, @scientific_name, @gives_live_birth,
            @avg_clutch_size, @litter_size_min, @litter_size_max,
            @incubation_days_min, @incubation_days_max, @notes, @created_at
          )
          ON CONFLICT(id) DO UPDATE SET
            common_name         = excluded.common_name,
            scientific_name     = excluded.scientific_name,
            gives_live_birth    = excluded.gives_live_birth,
            avg_clutch_size     = excluded.avg_clutch_size,
            litter_size_min     = excluded.litter_size_min,
            litter_size_max     = excluded.litter_size_max,
            incubation_days_min = excluded.incubation_days_min,
            incubation_days_max = excluded.incubation_days_max,
            notes               = excluded.notes
        `).run({ ...data, created_at: now })
        return { success: true }
      } catch (e) {
        return { success: false, error: e.message }
      }
    }

    db.prepare(`
      INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, String(value), now)
    return { success: true }
  })
}


// ── Database path handlers ────────────────────────────────────────────────────

function registerDbPathHandlers(ipcMain, dialog) {
  const dbModule = require('../database/db')

  ipcMain.handle('db:getPath', () => {
    return dbModule.getDbPath()
  })

  ipcMain.handle('db:isFirstRun', () => {
    // Read the config sidecar — once the wizard is completed the flag is written
    // there permanently, completely independent of animal count.
    try {
      const cfg = dbModule.readConfig()
      return cfg.first_run_completed !== true
    } catch (_) {
      return true
    }
  })

  ipcMain.handle('db:markNotFirstRun', () => {
    // Use the shared writeConfig helper from db.js so the path is always correct
    // regardless of whether the user has moved their database location.
    try {
      dbModule.writeConfig({ first_run_completed: true })
    } catch (e) {
      console.error('[FirstRun] Failed to write config:', e.message)
    }
    return { success: true }
  })

  ipcMain.handle('db:chooseFolder', async () => {
    const result = await dialog.showOpenDialog({
      title:      'Choose database storage folder',
      properties: ['openDirectory', 'createDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('db:setPath', async (_, newFolder) => {
    const pathLib = require('path')
    const fs      = require('fs')

    const currentPath = dbModule.getDbPath()

    // Always place the DB inside a ReptiLogic subfolder
    const reptiFolder = pathLib.join(newFolder, 'ReptiLogic')
    const newPath     = pathLib.join(reptiFolder, 'reptilogic.db')

    if (currentPath === newPath) {
      return { success: true, path: newPath, unchanged: true }
    }

    // Create the ReptiLogic subfolder if it doesn't exist
    try {
      fs.mkdirSync(reptiFolder, { recursive: true })
    } catch (e) {
      return { success: false, error: 'Could not create folder: ' + e.message }
    }

    const existsAtDestination = fs.existsSync(newPath)

    // Use SQLite backup API for a safe hot copy while DB is live
    try {
      await dbModule.getDb().backup(newPath)
    } catch (e) {
      return { success: false, error: 'Failed to copy database: ' + e.message }
    }

    // Persist new path in the JSON sidecar config (survives restarts)
    try {
      dbModule.setDbPath(newPath)
    } catch (e) {
      return { success: false, error: 'Failed to save path preference: ' + e.message }
    }

    return { success: true, path: newPath, existedAtDestination: existsAtDestination }
  })
}

// ── Morph count ───────────────────────────────────────────────────────────────

function registerMorphCountHandler(ipcMain) {
  const dbModule = require('../database/db')

  ipcMain.handle('morphs:getCount', () => {
    return dbModule.getDb().prepare('SELECT COUNT(*) AS total FROM morphs').get()
  })
}

function register(ipcMain, dialog) {
  registerExportHandlers(ipcMain, dialog)
  registerImportHandlers(ipcMain, dialog)
  registerSettingsHandlers(ipcMain)
  registerDbPathHandlers(ipcMain, dialog)
  registerMorphCountHandler(ipcMain)
}

module.exports = { register }
