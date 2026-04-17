const { app, BrowserWindow, ipcMain, dialog, Menu, nativeImage } = require('electron')
const fs   = require('fs')
const os   = require('os')
const path = require('path')

const isDev          = !app.isPackaged
const devServerUrl   = process.env.ELECTRON_RENDERER_URL || 'http://127.0.0.1:5173'
const shouldOpenDevTools = process.env.OPEN_DEVTOOLS === 'true'
const windowsAppId   = 'com.reptilogic.app'

// Remove the default application menu bar entirely
Menu.setApplicationMenu(null)

function configureAppPaths() {
  const localAppData  = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
  const userDataPath  = path.join(localAppData, 'ReptiLogic')
  const sessionDataPath = path.join(userDataPath, 'SessionData')
  const cachePath     = path.join(userDataPath, 'Cache')
  fs.mkdirSync(userDataPath,    { recursive: true })
  fs.mkdirSync(sessionDataPath, { recursive: true })
  fs.mkdirSync(cachePath,       { recursive: true })
  app.setPath('userData',    userDataPath)
  app.setPath('sessionData', sessionDataPath)
  app.setPath('cache',       cachePath)
}

app.setName('ReptiLogic')
if (process.platform === 'win32') app.setAppUserModelId(windowsAppId)
configureAppPaths()

function getAssetPath(...parts) {
  return path.join(__dirname, '../../resources', ...parts)
}

function getWindowIcon() {
  const preferred = process.platform === 'win32'
    ? getAssetPath('art', 'ReptiLogic.ico')
    : getAssetPath('art', 'ReptiLogic.png')
  if (fs.existsSync(preferred)) return nativeImage.createFromPath(preferred)
  return undefined
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    title: 'ReptiLogic',
    titleBarStyle: 'hidden',
    frame: false,
    transparent: false,
    backgroundColor: '#0f0f0f',
    roundedCorners: true,
    show: false,
    icon: getWindowIcon(),
  })

  // Window control IPC for custom title bar
  ipcMain.handle('window:minimize',    () => win.minimize())
  ipcMain.handle('window:maximize',    () => { win.isMaximized() ? win.unmaximize() : win.maximize() })
  ipcMain.handle('window:close',       () => win.close())
  ipcMain.handle('window:isMaximized', () => win.isMaximized())
  win.on('maximize',   () => win.webContents.send('window:maximized', true))
  win.on('unmaximize', () => win.webContents.send('window:maximized', false))

  if (isDev) {
    win.loadURL(devServerUrl)
    if (shouldOpenDevTools) win.webContents.openDevTools({ mode: 'detach' })
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
const animalHandlers   = require('./ipc/animalHandlers')
const morphHandlers    = require('./ipc/morphHandlers')
const breedingHandlers = require('./ipc/breedingHandlers')
const utilHandlers     = require('./ipc/utilHandlers')
const exportHandlers   = require('./ipc/exportHandlers')
const healthHandlers   = require('./ipc/healthHandlers')

try {
  animalHandlers.register(ipcMain)
  morphHandlers.register(ipcMain)
  breedingHandlers.register(ipcMain)
  utilHandlers.register(ipcMain, dialog)
  exportHandlers.register(ipcMain, dialog)
  healthHandlers.register(ipcMain)
} catch (err) {
  console.error('[IPC] Failed to register handlers:', err)
  dialog.showErrorBox('Startup error', 'Failed to register IPC handlers: ' + err.message)
  app.quit()
}
