const path = require('path')
const fs   = require('fs')
const { app } = require('electron')

let _db = null

function getDbPath() {
  // In dev, store DB next to the project. In production, use userData.
  const base = app.isPackaged
    ? app.getPath('userData')
    : path.join(__dirname, '../../../')
  return path.join(base, 'reptilogic.db')
}

function getDb() {
  if (!_db) throw new Error('Database not initialized. Call initialize() first.')
  return _db
}

function initialize() {
  if (_db) return _db

  const Database = require('better-sqlite3')
  const dbPath = getDbPath()
  const isVerbose = !app.isPackaged && process.env.DEBUG_SQL === 'true'

  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  console.log('[DB] Opening database at:', dbPath)

  _db = new Database(dbPath, { verbose: isVerbose ? console.log : null })

  // Performance pragmas
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  _db.pragma('synchronous = NORMAL')

  runMigrations()
  console.log('[DB] Initialized successfully')
  return _db
}

function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations')
  if (!fs.existsSync(migrationsDir)) return

  // Track applied migrations
  _db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      filename  TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    _db.prepare('SELECT filename FROM _migrations').all().map(r => r.filename)
  )

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (applied.has(file)) continue
    console.log('[DB] Applying migration:', file)
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    const applyMigration = _db.transaction(() => {
      _db.exec(sql)
      _db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file)
    })
    applyMigration()
  }
}

module.exports = { initialize, getDb, getDbPath }
