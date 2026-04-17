'use strict'

const { v4: uuidv4 } = require('uuid')
const { getDb } = require('../database/db')

const VALID_INHERITANCE = new Set(['recessive', 'co_dominant', 'dominant', 'line_bred', 'polygenetic'])

function normalizeText(value) {
  const text = String(value || '').trim()
  return text || null
}

function normalizeInteger(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function normalizeBool(value) {
  return value ? 1 : 0
}

function validateMorph(data) {
  const name = String(data?.name || '').trim()
  const speciesId = String(data?.species_id || '').trim()
  const inheritanceType = String(data?.inheritance_type || '').trim()

  if (!name) throw new Error('Morph name is required.')
  if (!speciesId) throw new Error('Species is required.')
  if (!VALID_INHERITANCE.has(inheritanceType)) throw new Error('Choose a valid inheritance type.')

  return {
    id: data?.id || uuidv4(),
    species_id: speciesId,
    name,
    gene_symbol: normalizeText(data?.gene_symbol),
    category: normalizeText(data?.category),
    inheritance_type: inheritanceType,
    super_form_name: normalizeText(data?.super_form_name),
    has_health_concern: normalizeBool(data?.has_health_concern),
    health_concern_desc: normalizeText(data?.health_concern_desc),
    description: normalizeText(data?.description),
    also_known_as: normalizeText(data?.also_known_as),
    discovered_year: normalizeInteger(data?.discovered_year),
    is_combo: normalizeBool(data?.is_combo),
    combo_components: normalizeText(data?.combo_components),
    sort_order: normalizeInteger(data?.sort_order) ?? 999,
    is_user_created: 1,
  }
}

function register(ipcMain) {
  ipcMain.handle('morphs:getBySpecies', (_, speciesId) => {
    return getDb().prepare(`
      SELECT * FROM morphs
      WHERE species_id = ?
      ORDER BY sort_order, name
    `).all(speciesId)
  })

  ipcMain.handle('morphs:getAll', () => {
    return getDb().prepare(`
      SELECT m.*, s.common_name AS species_name
      FROM morphs m
      JOIN species s ON s.id = m.species_id
      ORDER BY s.common_name, m.sort_order, m.name
    `).all()
  })

  ipcMain.handle('morphs:search', (_, query) => {
    const like = `%${query}%`
    return getDb().prepare(`
      SELECT m.*, s.common_name AS species_name
      FROM morphs m
      JOIN species s ON s.id = m.species_id
      WHERE m.name LIKE ? OR m.also_known_as LIKE ? OR m.gene_symbol LIKE ?
      ORDER BY m.sort_order, m.name
      LIMIT 50
    `).all(like, like, like)
  })

  ipcMain.handle('morphs:getCategories', (_, speciesId) => {
    return getDb()
      .prepare(`SELECT DISTINCT category FROM morphs WHERE species_id = ? AND category IS NOT NULL ORDER BY category`)
      .all(speciesId)
      .map(r => r.category)
  })

  ipcMain.handle('morphs:create', (_, data) => {
    const db = getDb()
    const morph = validateMorph(data)

    const duplicate = db.prepare(`
      SELECT id FROM morphs
      WHERE species_id = ? AND lower(name) = lower(?)
    `).get(morph.species_id, morph.name)

    if (duplicate) {
      throw new Error(`A morph named "${morph.name}" already exists for this species.`)
    }

    db.prepare(`
      INSERT INTO morphs (
        id, species_id, name, gene_symbol, category, inheritance_type,
        super_form_name, has_health_concern, health_concern_desc,
        description, also_known_as, discovered_year, is_combo,
        combo_components, sort_order, is_user_created
      ) VALUES (
        @id, @species_id, @name, @gene_symbol, @category, @inheritance_type,
        @super_form_name, @has_health_concern, @health_concern_desc,
        @description, @also_known_as, @discovered_year, @is_combo,
        @combo_components, @sort_order, @is_user_created
      )
    `).run(morph)

    return db.prepare(`
      SELECT m.*, s.common_name AS species_name
      FROM morphs m
      JOIN species s ON s.id = m.species_id
      WHERE m.id = ?
    `).get(morph.id)
  })
}

module.exports = { register }
