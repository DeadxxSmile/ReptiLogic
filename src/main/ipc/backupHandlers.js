'use strict'

const path = require('path')
const fs   = require('fs')
const { getDb, getDbPath } = require('../database/db')
const dbModule = require('../database/db')

// ── zip helper (no external dep – use Node's built-in zlib) ──────────────────
// We write a minimal ZIP archive containing a single file entry.
// Format: local file header + data + central dir + end of central dir.

function writeZip(zipPath, entryName, data) {
  const zlib = require('zlib')
  const deflated = zlib.deflateRawSync(data, { level: 6 })

  // CRC-32 table
  const crcTable = (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
      t[i] = c
    }
    return t
  })()

  function crc32(buf) {
    let c = 0xffffffff
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }

  const nameBytes     = Buffer.from(entryName, 'utf8')
  const crc           = crc32(data)
  const now           = new Date()
  const dosDate       = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
  const dosTime       = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)
  const uncompressedSize = data.length
  const compressedSize   = deflated.length

  // Local file header
  const localHeader = Buffer.alloc(30 + nameBytes.length)
  localHeader.writeUInt32LE(0x04034b50, 0)  // signature
  localHeader.writeUInt16LE(20, 4)           // version needed
  localHeader.writeUInt16LE(0, 6)            // flags
  localHeader.writeUInt16LE(8, 8)            // method: deflate
  localHeader.writeUInt16LE(dosTime, 10)
  localHeader.writeUInt16LE(dosDate, 12)
  localHeader.writeUInt32LE(crc, 14)
  localHeader.writeUInt32LE(compressedSize, 18)
  localHeader.writeUInt32LE(uncompressedSize, 22)
  localHeader.writeUInt16LE(nameBytes.length, 26)
  localHeader.writeUInt16LE(0, 28)           // extra length
  nameBytes.copy(localHeader, 30)

  const localOffset = 0

  // Central directory header
  const centralHeader = Buffer.alloc(46 + nameBytes.length)
  centralHeader.writeUInt32LE(0x02014b50, 0) // signature
  centralHeader.writeUInt16LE(20, 4)          // version made by
  centralHeader.writeUInt16LE(20, 6)          // version needed
  centralHeader.writeUInt16LE(0, 8)           // flags
  centralHeader.writeUInt16LE(8, 10)          // method
  centralHeader.writeUInt16LE(dosTime, 12)
  centralHeader.writeUInt16LE(dosDate, 14)
  centralHeader.writeUInt32LE(crc, 16)
  centralHeader.writeUInt32LE(compressedSize, 20)
  centralHeader.writeUInt32LE(uncompressedSize, 24)
  centralHeader.writeUInt16LE(nameBytes.length, 28)
  centralHeader.writeUInt16LE(0, 30)          // extra
  centralHeader.writeUInt16LE(0, 32)          // comment
  centralHeader.writeUInt16LE(0, 34)          // disk start
  centralHeader.writeUInt16LE(0, 36)          // int attrs
  centralHeader.writeUInt32LE(0, 38)          // ext attrs
  centralHeader.writeUInt32LE(localOffset, 42)
  nameBytes.copy(centralHeader, 46)

  const centralOffset = localHeader.length + deflated.length
  const centralSize   = centralHeader.length

  // End of central directory
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(0, 4)                    // disk number
  eocd.writeUInt16LE(0, 6)                    // disk with start
  eocd.writeUInt16LE(1, 8)                    // entries on disk
  eocd.writeUInt16LE(1, 10)                   // total entries
  eocd.writeUInt32LE(centralSize, 12)
  eocd.writeUInt32LE(centralOffset, 16)
  eocd.writeUInt16LE(0, 20)                   // comment length

  fs.writeFileSync(zipPath, Buffer.concat([localHeader, deflated, centralHeader, eocd]))
}

// ── Core backup logic ─────────────────────────────────────────────────────────

async function runBackup(folder) {
  if (!folder) throw new Error('No backup folder configured.')
  fs.mkdirSync(folder, { recursive: true })

  const stamp   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const dbName  = `reptilogic-backup-${stamp}.db`
  const zipName = `reptilogic-backup-${stamp}.zip`
  const tmpDb   = path.join(folder, dbName)
  const zipPath = path.join(folder, zipName)

  // SQLite hot backup
  const db = getDb()
  await db.backup(tmpDb)

  // Compress to zip and remove temp file
  const dbData = fs.readFileSync(tmpDb)
  writeZip(zipPath, dbName, dbData)
  fs.rmSync(tmpDb, { force: true })

  // Rotate: delete oldest beyond keep_count
  const settings = getSettings()
  const keepCount = Math.max(1, parseInt(settings.backup_keep_count || '10', 10))
  pruneBackups(folder, keepCount)

  return { success: true, path: zipPath }
}

function getSettings() {
  try {
    const rows = getDb().prepare('SELECT key, value FROM app_settings').all()
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  } catch (_) { return {} }
}

function pruneBackups(folder, keepCount) {
  try {
    const files = fs.readdirSync(folder)
      .filter(f => f.startsWith('reptilogic-backup-') && f.endsWith('.zip'))
      .sort()  // lexicographic = chronological because of ISO stamp

    if (files.length > keepCount) {
      const toDelete = files.slice(0, files.length - keepCount)
      for (const f of toDelete) {
        fs.rmSync(path.join(folder, f), { force: true })
      }
    }
  } catch (_) {}
}

function listBackups(folder) {
  if (!folder || !fs.existsSync(folder)) return []
  return fs.readdirSync(folder)
    .filter(f => f.startsWith('reptilogic-backup-') && f.endsWith('.zip'))
    .sort()
    .reverse()
    .map(f => ({
      filename: f,
      path:     path.join(folder, f),
      size:     fs.statSync(path.join(folder, f)).size,
    }))
}

async function restoreBackup(zipPath) {
  if (!fs.existsSync(zipPath)) throw new Error('Backup file not found.')

  // Extract the .db from the zip
  const zipData  = fs.readFileSync(zipPath)
  const dbBuffer = extractFirstEntry(zipData)
  const destPath = getDbPath()

  const liveDb = getDb()
  liveDb.pragma('wal_checkpoint(TRUNCATE)')
  dbModule.close()

  for (const suffix of ['', '-wal', '-shm']) {
    const t = `${destPath}${suffix}`
    if (fs.existsSync(t)) fs.rmSync(t, { force: true })
  }

  fs.writeFileSync(destPath, dbBuffer)
  dbModule.initialize()

  return { success: true, path: destPath }
}

// Minimal ZIP extractor – reads the first local file entry and inflates it
function extractFirstEntry(zipBuf) {
  const zlib = require('zlib')
  if (zipBuf.readUInt32LE(0) !== 0x04034b50) throw new Error('Not a valid ZIP file.')
  const method     = zipBuf.readUInt16LE(8)
  const compSize   = zipBuf.readUInt32LE(18)
  const nameLen    = zipBuf.readUInt16LE(26)
  const extraLen   = zipBuf.readUInt16LE(28)
  const dataOffset = 30 + nameLen + extraLen
  const compressed = zipBuf.slice(dataOffset, dataOffset + compSize)
  if (method === 0) return compressed                                  // stored
  if (method === 8) return zlib.inflateRawSync(compressed)            // deflated
  throw new Error('Unsupported ZIP compression method: ' + method)
}

// ── Register ──────────────────────────────────────────────────────────────────

function register(ipcMain, dialog, app) {
  ipcMain.handle('backup:run', async () => {
    const settings = getSettings()
    const folder   = settings.backup_folder
    if (!folder) return { success: false, error: 'No backup folder set. Configure one in Settings → Backup.' }
    try {
      return await runBackup(folder)
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('backup:runToFolder', async (_, folder) => {
    try {
      return await runBackup(folder)
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('backup:chooseFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose backup folder',
      properties: ['openDirectory', 'createDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('backup:chooseFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose backup to restore',
      filters: [{ name: 'ReptiLogic Backup', extensions: ['zip', 'db'] }],
      properties: ['openFile'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('backup:list', (_, folder) => {
    return listBackups(folder)
  })

  ipcMain.handle('backup:restore', async (_, zipPath) => {
    try {
      return await restoreBackup(zipPath)
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  // Called by main process on app-close trigger
  ipcMain.handle('backup:runIfConfigured', async () => {
    const settings = getSettings()
    if (settings.backup_enabled !== '1') return { skipped: true }
    if (settings.backup_trigger !== 'on_close') return { skipped: true }
    const folder = settings.backup_folder
    if (!folder) return { skipped: true }
    try {
      return await runBackup(folder)
    } catch (e) {
      return { success: false, error: e.message }
    }
  })
}

module.exports = { register, runBackup, getSettings, pruneBackups }
