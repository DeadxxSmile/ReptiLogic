'use strict'

const { getDb } = require('../database/db')

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
}

module.exports = { register }
