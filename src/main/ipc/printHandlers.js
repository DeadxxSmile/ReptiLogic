'use strict'

const path = require('path')
const fs   = require('fs')
const { getDb } = require('../database/db')

// ── Copy logo to app data directory ─────────────────────────────────────────
function copyLogoToAppDir(srcPath) {
  const { app } = require('electron')
  const base     = app.isPackaged ? app.getPath('userData') : path.join(__dirname, '../../../')
  const logoDir  = path.join(base, 'breeder-assets')
  fs.mkdirSync(logoDir, { recursive: true })

  const ext      = path.extname(srcPath).toLowerCase()
  const destName = `breeder-logo${ext}`
  const destPath = path.join(logoDir, destName)
  fs.copyFileSync(srcPath, destPath)
  return destPath
}

function getLogoPath() {
  const db = getDb()
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'breeder_logo_path'").get()
  return row?.value || null
}

// ── Build HTML print document ─────────────────────────────────────────────────

function buildHusbandryHtml(animalId, settings) {
  const db = getDb()

  const animal = db.prepare(`
    SELECT a.*, s.common_name AS species_name, s.scientific_name,
           p.filename AS primary_photo_filename
    FROM animals a
    JOIN species s ON s.id = a.species_id
    LEFT JOIN photos p ON p.id = a.primary_photo_id
    WHERE a.id = ?
  `).get(animalId)

  if (!animal) throw new Error('Animal not found.')

  const morphs = db.prepare(`
    SELECT m.name, am.expression, am.het_percent, m.inheritance_type
    FROM animal_morphs am
    JOIN morphs m ON m.id = am.morph_id
    WHERE am.animal_id = ?
    ORDER BY m.sort_order
  `).all(animalId)

  const measurements = db.prepare(`
    SELECT * FROM measurements WHERE animal_id = ? ORDER BY measured_at ASC
  `).all(animalId)

  const feedings = db.prepare(`
    SELECT * FROM feedings WHERE animal_id = ? ORDER BY fed_at DESC LIMIT 30
  `).all(animalId)

  // Lineage
  const father = animal.father_id
    ? db.prepare('SELECT id, name, animal_id FROM animals WHERE id = ?').get(animal.father_id)
    : null
  const mother = animal.mother_id
    ? db.prepare('SELECT id, name, animal_id FROM animals WHERE id = ?').get(animal.mother_id)
    : null

  function getParents(id) {
    if (!id) return { father: null, mother: null }
    const a = db.prepare('SELECT father_id, mother_id FROM animals WHERE id = ?').get(id)
    if (!a) return { father: null, mother: null }
    const f = a.father_id ? db.prepare('SELECT id, name, animal_id FROM animals WHERE id = ?').get(a.father_id) : null
    const m = a.mother_id ? db.prepare('SELECT id, name, animal_id FROM animals WHERE id = ?').get(a.mother_id) : null
    return { father: f, mother: m }
  }

  const paternalLine = getParents(animal.father_id)
  const maternalLine = getParents(animal.mother_id)

  // Photo path resolution
  const { app } = require('electron')
  const photosDir = path.join(app.isPackaged ? app.getPath('userData') : path.join(__dirname, '../../../'), 'animal-photos')
  let photoDataUrl = null
  if (animal.primary_photo_filename) {
    const photoPath = path.join(photosDir, animal.primary_photo_filename)
    if (fs.existsSync(photoPath)) {
      const ext  = path.extname(photoPath).toLowerCase().slice(1) || 'jpeg'
      const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg'
      photoDataUrl = `data:${mime};base64,${fs.readFileSync(photoPath).toString('base64')}`
    }
  }

  // Breeder logo (prefer copied app-dir version)
  let logoDataUrl = null
  const logoPath = settings?.breeder_logo_path
  if (logoPath && fs.existsSync(logoPath)) {
    const ext  = path.extname(logoPath).toLowerCase().slice(1) || 'png'
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    logoDataUrl = `data:${mime};base64,${fs.readFileSync(logoPath).toString('base64')}`
  }

  function morphLabel(m) {
    if (m.expression === 'visual')       return m.name
    if (m.expression === 'het')          return `Het ${m.name}`
    if (m.expression === 'super')        return `Super ${m.name}`
    if (m.expression === 'proven_het')   return `Proven Het ${m.name}`
    if (m.expression === 'possible_het') return `${m.het_percent || 50}% Poss Het ${m.name}`
    return m.name
  }

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function fmtWeight(g) {
    if (!g) return '—'
    return `${g}g`
  }

  function parentLine(p, label) {
    if (!p) return `<span style="color:#aaa">Unknown ${label}</span>`
    return `${p.name}${p.animal_id ? ` <span style="color:#888;font-size:11px">(${p.animal_id})</span>` : ''}`
  }

  const morphStr = morphs.length ? morphs.map(morphLabel).join(', ') : 'Normal'
  const latestWeight = measurements.length ? measurements[measurements.length - 1] : null

  const feedingRows = feedings.slice(0, 20).map(f => `
    <tr>
      <td>${fmtDate(f.fed_at)}</td>
      <td>${f.prey_type || '—'}</td>
      <td>${f.prey_size || '—'}</td>
      <td>${f.prey_weight_grams ? f.prey_weight_grams + 'g' : '—'}</td>
      <td>${f.refused ? '✗ Refused' : '✓ Accepted'}</td>
    </tr>
  `).join('')

  const measureRows = measurements.slice(-20).reverse().map(m => `
    <tr>
      <td>${fmtDate(m.measured_at)}</td>
      <td>${m.weight_grams ? m.weight_grams + 'g' : '—'}</td>
      <td>${m.length_cm ? m.length_cm + ' cm' : '—'}</td>
    </tr>
  `).join('')

  // Socials block
  const socials = []
  if (settings?.breeder_website)  socials.push(`🌐 ${settings.breeder_website}`)
  if (settings?.breeder_instagram) socials.push(`📸 Instagram: ${settings.breeder_instagram}`)
  if (settings?.breeder_facebook) socials.push(`📘 Facebook: ${settings.breeder_facebook}`)
  if (settings?.breeder_x)        socials.push(`𝕏 X/Twitter: ${settings.breeder_x}`)
  if (settings?.breeder_youtube)  socials.push(`▶ YouTube: ${settings.breeder_youtube}`)
  if (settings?.breeder_tiktok)   socials.push(`🎵 TikTok: ${settings.breeder_tiktok}`)
  const socialsHtml = socials.length
    ? `<div style="font-size:11px;color:#666;margin-top:4px;display:flex;flex-wrap:wrap;gap:12px">${socials.map(s=>`<span>${s}</span>`).join('')}</div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Husbandry Report – ${animal.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; font-size: 13px; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }
  .header { display: flex; align-items: flex-start; gap: 24px; border-bottom: 2px solid #2a7a4b; padding-bottom: 20px; margin-bottom: 24px; }
  .header-logo img { max-height: 80px; max-width: 160px; object-fit: contain; }
  .header-info { flex: 1; }
  .breeder-name { font-size: 20px; font-weight: 700; color: #2a7a4b; }
  .report-title { font-size: 14px; color: #666; margin-top: 4px; }
  .animal-block { display: flex; gap: 24px; margin-bottom: 28px; }
  .animal-photo img { width: 160px; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; }
  .animal-photo-placeholder { width: 160px; height: 160px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 40px; }
  .animal-info { flex: 1; }
  .animal-name { font-size: 22px; font-weight: 700; }
  .animal-id { font-size: 13px; color: #666; font-family: monospace; margin-top: 2px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-top: 14px; }
  .info-row label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .5px; display: block; }
  .info-row span { font-size: 13px; font-weight: 500; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 14px; font-weight: 700; color: #2a7a4b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; margin-bottom: 12px; }
  .morphs-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .morph-pill { background: #e8f5ee; color: #2a7a4b; border: 1px solid #b3d9c4; border-radius: 12px; padding: 3px 10px; font-size: 12px; font-weight: 500; }
  .lineage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .lineage-col h4 { font-size: 12px; color: #888; margin-bottom: 8px; }
  .lineage-box { background: #f8f8f8; border: 1px solid #e8e8e8; border-radius: 6px; padding: 10px; }
  .lineage-name { font-weight: 600; }
  .lineage-gp { font-size: 11px; color: #888; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f0f0f0; padding: 6px 10px; text-align: left; font-weight: 600; color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
  td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #aaa; display: flex; justify-content: space-between; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    ${logoDataUrl ? `<div class="header-logo"><img src="${logoDataUrl}" alt="logo"></div>` : ''}
    <div class="header-info">
      ${settings?.breeder_name ? `<div class="breeder-name">${settings.breeder_name}</div>` : ''}
      <div class="report-title">Animal Husbandry Report &mdash; Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      ${socialsHtml}
    </div>
  </div>

  <!-- Animal Summary -->
  <div class="animal-block">
    <div class="animal-photo">
      ${photoDataUrl
        ? `<img src="${photoDataUrl}" alt="${animal.name}">`
        : `<div class="animal-photo-placeholder">🐍</div>`}
    </div>
    <div class="animal-info">
      <div class="animal-name">${animal.name}</div>
      ${animal.animal_id ? `<div class="animal-id">ID: ${animal.animal_id}</div>` : ''}
      <div class="info-grid">
        <div class="info-row"><label>Species</label><span>${animal.species_name}</span></div>
        <div class="info-row"><label>Sex</label><span>${animal.sex.charAt(0).toUpperCase() + animal.sex.slice(1)}</span></div>
        <div class="info-row"><label>Date of Birth</label><span>${fmtDate(animal.dob)}${animal.dob_estimated ? ' (est.)' : ''}</span></div>
        <div class="info-row"><label>Current Weight</label><span>${fmtWeight(latestWeight?.weight_grams || animal.weight_grams)}</span></div>
        <div class="info-row"><label>Acquired</label><span>${fmtDate(animal.acquired_date)}</span></div>
        <div class="info-row"><label>Acquired From</label><span>${animal.acquired_from || '—'}</span></div>
        <div class="info-row"><label>Status</label><span>${animal.status}</span></div>
      </div>
    </div>
  </div>

  <!-- Morphs -->
  <div class="section">
    <div class="section-title">Genetics / Morphs</div>
    <div class="morphs-list">
      ${morphs.length
        ? morphs.map(m => `<span class="morph-pill">${morphLabel(m)}</span>`).join('')
        : '<span style="color:#aaa">Normal / No morphs</span>'}
    </div>
  </div>

  <!-- Lineage -->
  <div class="section">
    <div class="section-title">Lineage</div>
    <div class="lineage-grid">
      <div>
        <h4>Sire (Father)</h4>
        <div class="lineage-box">
          <div class="lineage-name">${parentLine(father, 'Sire')}</div>
          ${father ? `<div class="lineage-gp">
            Paternal Grandsire: ${parentLine(paternalLine.father, 'Grandsire')}<br>
            Paternal Granddam: ${parentLine(paternalLine.mother, 'Granddam')}
          </div>` : ''}
        </div>
      </div>
      <div>
        <h4>Dam (Mother)</h4>
        <div class="lineage-box">
          <div class="lineage-name">${parentLine(mother, 'Dam')}</div>
          ${mother ? `<div class="lineage-gp">
            Maternal Grandsire: ${parentLine(maternalLine.father, 'Grandsire')}<br>
            Maternal Granddam: ${parentLine(maternalLine.mother, 'Granddam')}
          </div>` : ''}
        </div>
      </div>
    </div>
  </div>

  <!-- Weight Log -->
  ${measurements.length ? `
  <div class="section">
    <div class="section-title">Weight & Length Log</div>
    <table>
      <thead><tr><th>Date</th><th>Weight</th><th>Length</th></tr></thead>
      <tbody>${measureRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Feeding Log -->
  ${feedings.length ? `
  <div class="section">
    <div class="section-title">Feeding History (Last 20)</div>
    <table>
      <thead><tr><th>Date</th><th>Prey Type</th><th>Size</th><th>Prey Weight</th><th>Result</th></tr></thead>
      <tbody>${feedingRows}</tbody>
    </table>
  </div>` : ''}

  ${animal.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <p style="font-size:13px;line-height:1.6;color:#444">${animal.notes.replace(/\n/g,'<br>')}</p>
  </div>` : ''}

  <div class="footer">
    <span>${settings?.breeder_name ? settings.breeder_name + ' — ' : ''}ReptiLogic Husbandry Report</span>
    <span>${new Date().toISOString().slice(0, 10)}</span>
  </div>
</div>
</body>
</html>`

  return html
}

// ── Register ──────────────────────────────────────────────────────────────────

function register(ipcMain, dialog) {
  ipcMain.handle('print:husbandryReport', async (_, animalId) => {
    try {
      const db = getDb()
      const settings = Object.fromEntries(
        db.prepare('SELECT key, value FROM app_settings').all().map(r => [r.key, r.value])
      )
      const html = buildHusbandryHtml(animalId, settings)
      return { success: true, html }
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('print:chooseLogo', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose breeder logo',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'tiff', 'tif', 'bmp'] }],
      properties: ['openFile'],
    })
    if (result.canceled) return null
    const srcPath = result.filePaths[0]
    try {
      const destPath = copyLogoToAppDir(srcPath)
      return destPath
    } catch (e) {
      return srcPath // fallback to original path
    }
  })

  ipcMain.handle('print:getLogoDataUrl', () => {
    try {
      const logoPath = getLogoPath()
      if (!logoPath || !fs.existsSync(logoPath)) return null
      const ext  = path.extname(logoPath).toLowerCase().slice(1) || 'png'
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
      return `data:${mime};base64,${fs.readFileSync(logoPath).toString('base64')}`
    } catch (e) {
      return null
    }
  })
}

module.exports = { register }
