import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import * as path from 'path'
import Store from 'electron-store'
import { AppConfig, DEFAULT_CONFIG, IPC } from '../shared/types'
import { registerFileHandlers, rebuildMenu, initStylesFolder } from './fileManager'
import { registerPdfHandler } from './pdfExporter'
import { setLanguage } from '../shared/i18n'

// Suppress Autofill DevTools noise
app.commandLine.appendSwitch('disable-features', 'Autofill')

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null
const store = new Store<AppConfig>({ defaults: DEFAULT_CONFIG }) as Store<AppConfig>

function createWindow(): void {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'resources', 'icon.png')
    : path.join(app.getAppPath(), 'resources', 'icon.png')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Magnesium',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow?.webContents.send(IPC.WINDOW_BEFORE_CLOSE)
  })

  ipcMain.on(IPC.WINDOW_CLOSE_CONFIRMED, () => {
    mainWindow?.destroy()
  })

  ipcMain.on(IPC.WINDOW_CLOSE_CANCELLED, () => {
    // no-op
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.on('did-finish-load', () => {
    const fs = require('fs') as typeof import('fs')
    const lastFile = store.get('lastOpenedFile')
    if (lastFile) {
      try {
        const content = fs.readFileSync(lastFile, 'utf-8')
        mainWindow?.webContents.send(IPC.FILE_LOADED, { content, filePath: lastFile })
        return
      } catch {
        store.set('lastOpenedFile', null)
      }
    }
    // No last file — load the welcome document
    const helloPath = app.isPackaged
      ? path.join(process.resourcesPath, 'resources', 'hello.md')
      : path.join(app.getAppPath(), 'resources', 'hello.md')
    try {
      const content = fs.readFileSync(helloPath, 'utf-8')
      mainWindow?.webContents.send(IPC.FILE_LOADED, { content, filePath: null })
    } catch { /* file missing in dev — no-op */ }
  })

  registerFileHandlers(mainWindow, store)
  registerPdfHandler(mainWindow)
  rebuildMenu(store, mainWindow)
}

// Native close confirmation dialog (avoids GTK signal issues from window.confirm)
ipcMain.handle(IPC.SHOW_CLOSE_DIALOG, async () => {
  if (!mainWindow) return 'cancel'
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Save', 'Discard', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    title: 'Unsaved changes',
    message: 'You have unsaved changes.',
    detail: 'Do you want to save before closing?'
  })
  if (response === 0) return 'save'
  if (response === 1) return 'discard'
  return 'cancel'
})

// Native discard confirmation (New / Open with unsaved changes)
ipcMain.handle(IPC.SHOW_DISCARD_DIALOG, async () => {
  if (!mainWindow) return false
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Discard', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Unsaved changes',
    message: 'You have unsaved changes.',
    detail: 'Discard changes and continue?'
  })
  return response === 0
})

// Open external URLs safely in the system browser
ipcMain.handle(IPC.SHELL_OPEN_EXTERNAL, (_event, url: string) => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      shell.openExternal(url)
    }
  } catch { /* ignore invalid URLs */ }
})

// Rebuild native menu with new language
ipcMain.handle(IPC.MENU_REBUILD, (_event, lang: string) => {
  setLanguage(lang as 'en' | 'gl')
  if (mainWindow) rebuildMenu(store, mainWindow)
})

app.whenReady().then(async () => {
  await initStylesFolder(app.getPath('userData'))
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

void dialog
void ipcMain
