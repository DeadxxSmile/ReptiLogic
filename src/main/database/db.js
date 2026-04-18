'use strict'

const path = require('path')
const fs   = require('fs')
const { app } = require('electron')

let _db = null

// ── Path resolution ───────────────────────────────────────────────────────────
// Custom path is stored in a tiny JSON sidecar next to the default DB location.
// This avoids the chicken-and-egg problem of reading the DB to find the DB path.

function getConfigPath() {
  const base = app.isPackaged
    ? app.getPath('userData')
    : path.join(__dirname, '../../../')
  return path.join(base, 'reptilogic-config.json')
}

function readConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8')
    return JSON.parse(raw)
  } catch (_) {
    return {}
  }
}

function writeConfig(data) {
  const current = readConfig()
  fs.writeFileSync(getConfigPath(), JSON.stringify({ ...current, ...data }, null, 2), 'utf8')
}

function getDefaultDbPath() {
  const base = app.isPackaged
    ? app.getPath('userData')
    : path.join(__dirname, '../../../')
  return path.join(base, 'reptilogic.db')
}

function getDbPath() {
  const cfg = readConfig()
  return cfg.db_path || getDefaultDbPath()
}

function setDbPath(newPath) {
  writeConfig({ db_path: newPath })
}

// ── DB access ─────────────────────────────────────────────────────────────────

function getDb() {
  if (!_db) throw new Error('Database not initialized. Call initialize() first.')
  return _db
}

function initialize() {
  if (_db) return _db

  const Database = require('better-sqlite3')
  const dbPath   = getDbPath()
  const isVerbose = !app.isPackaged && process.env.DEBUG_SQL === 'true'

  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  console.log('[DB] Opening database at:', dbPath)

  _db = new Database(dbPath, { verbose: isVerbose ? console.log : null })
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  _db.pragma('synchronous = NORMAL')

  runMigrations()
  console.log('[DB] Initialized successfully')
  return _db
}

function close() {
  if (_db) { _db.close(); _db = null }
}

function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations')
  if (!fs.existsSync(migrationsDir)) return

  _db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    _db.prepare('SELECT filename FROM _migrations').all().map(r => r.filename)
  )

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  const pending = files.filter(f => !applied.has(f))
  if (pending.length === 0) return

  // ── Pre-migration cleanup ─────────────────────────────────────────────────
  // Migration 010 rebuilds the morphs table via a temp table. If a previous
  // run failed partway through, either morphs_old or morphs_migration_tmp may
  // be left behind. Clean these up before running migrations.
  _db.pragma('foreign_keys = OFF')

  const tableExists = (name) =>
    _db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name=?").get(name).n > 0

  // Handle stuck morphs_old (from even older failed migration strategy)
  if (tableExists('morphs_old')) {
    if (!tableExists('morphs')) {
      _db.exec('ALTER TABLE morphs_old RENAME TO morphs')
      console.log('[DB] Restored morphs from morphs_old')
    } else {
      _db.exec('DROP TABLE morphs_old')
      console.log('[DB] Dropped orphaned morphs_old')
    }
  }

  // Handle stuck morphs_migration_tmp (from current migration 010 strategy)
  if (tableExists('morphs_migration_tmp')) {
    if (!tableExists('morphs')) {
      // Data is in the tmp table but morphs was already dropped — recreate from tmp
      _db.exec(`
        CREATE TABLE morphs (
          id TEXT PRIMARY KEY, species_id TEXT NOT NULL, name TEXT NOT NULL,
          gene_symbol TEXT, category TEXT,
          inheritance_type TEXT NOT NULL
            CHECK(inheritance_type IN ('recessive','co_dominant','dominant','line_bred','polygenetic','sex_linked')),
          super_form_name TEXT, has_health_concern INTEGER NOT NULL DEFAULT 0,
          health_concern_desc TEXT, description TEXT, also_known_as TEXT,
          discovered_year INTEGER, is_combo INTEGER NOT NULL DEFAULT 0,
          combo_components TEXT, sort_order INTEGER DEFAULT 999,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          is_user_created INTEGER NOT NULL DEFAULT 0,
          allele_group_id TEXT, cross_allele_result TEXT,
          is_sex_linked INTEGER NOT NULL DEFAULT 0
        )
      `)
      _db.exec(`
        INSERT INTO morphs (id,species_id,name,gene_symbol,category,inheritance_type,
          super_form_name,has_health_concern,health_concern_desc,description,also_known_as,
          discovered_year,is_combo,combo_components,sort_order,created_at,
          is_user_created,allele_group_id,cross_allele_result,is_sex_linked)
        SELECT id,species_id,name,gene_symbol,category,inheritance_type,
          super_form_name,has_health_concern,health_concern_desc,description,also_known_as,
          discovered_year,is_combo,combo_components,sort_order,created_at,
          COALESCE(is_user_created,0),COALESCE(allele_group_id,NULL),
          COALESCE(cross_allele_result,NULL),0
        FROM morphs_migration_tmp
      `)
      console.log('[DB] Restored morphs from morphs_migration_tmp')
    }
    _db.exec('DROP TABLE morphs_migration_tmp')
    console.log('[DB] Dropped morphs_migration_tmp')
  }

  _db.pragma('foreign_keys = ON')

  // Disable FK checks for the duration of all pending migrations.
  // PRAGMA foreign_keys cannot be changed inside a transaction, so we do it
  // here at the connection level before any migration transaction starts.
  // FK enforcement is re-enabled immediately after all migrations complete.
  // This is safe: migrations only operate on seed/schema data, never user data.
  _db.pragma('foreign_keys = OFF')

  try {
    for (const file of pending) {
      console.log('[DB] Applying migration:', file)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      const applyMigration = _db.transaction(() => {
        _db.exec(sql)
        _db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file)
      })
      applyMigration()
    }
  } finally {
    _db.pragma('foreign_keys = ON')
  }
}

module.exports = { initialize, getDb, getDbPath, setDbPath, getDefaultDbPath, readConfig, writeConfig, close }
