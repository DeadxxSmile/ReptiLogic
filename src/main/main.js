const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

const isDev = !app.isPackaged
const devServerUrl = process.env.ELECTRON_RENDERER_URL || 'http://127.0.0.1:5173'
const shouldOpenDevTools = process.env.OPEN_DEVTOOLS === 'true'

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'default',
    backgroundColor: '#0f0f0f',
    show: false
  })

  if (isDev) {
    win.loadURL(devServerUrl)
    if (shouldOpenDevTools) {
      win.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    win.loadFile(path.join(__dirname, '../../build/index.html'))
  }

  win.once('ready-to-show', () => win.show())
}


app.whenReady().then(() => {
  const db = require('./database/db')

  try {
    db.initialize()
  } catch (error) {
    dialog.showErrorBox('Database startup failed', error.message)
    app.quit()
    return
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC handlers ──────────────────────────────────────────────────────────────
// Each handler delegates to a service module to keep main.js clean

const animalHandlers   = require('./ipc/animalHandlers')
const morphHandlers    = require('./ipc/morphHandlers')
const breedingHandlers = require('./ipc/breedingHandlers')
const utilHandlers     = require('./ipc/utilHandlers')
const exportHandlers   = require('./ipc/exportHandlers')
const healthHandlers   = require('./ipc/healthHandlers')

animalHandlers.register(ipcMain)
morphHandlers.register(ipcMain)
breedingHandlers.register(ipcMain)
utilHandlers.register(ipcMain, dialog)
exportHandlers.register(ipcMain, dialog)
healthHandlers.register(ipcMain)
