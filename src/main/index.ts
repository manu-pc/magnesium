import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import Store from 'electron-store'
import { AppConfig, DEFAULT_CONFIG, IPC } from '../shared/types'
import { registerFileHandlers, rebuildMenu, initStylesFolder } from './fileManager'
import { registerPdfHandler } from './pdfExporter'
import { setLanguage } from '../shared/i18n'

const SUPPORTED_EXTS = new Set([
  '.md', '.markdown', '.txt',
  '.c', '.h', '.cpp', '.cc', '.cxx', '.hpp',
  '.java', '.py', '.html', '.htm', '.css', '.js', '.ts'
])

/** Return a file path passed as CLI argument (e.g. when launched via file-manager association). */
function getCliFile(argv?: string[]): string | null {
  // In packaged app argv[0] is the executable; in dev argv[0]=electron, argv[1]=script
  const rawArgs = argv ?? process.argv
  const args = rawArgs.slice(app.isPackaged ? 1 : 2)
  for (const arg of args) {
    if (arg.startsWith('-')) continue
    const resolved = path.resolve(arg)
    if (SUPPORTED_EXTS.has(path.extname(resolved).toLowerCase()) && fs.existsSync(resolved)) {
      return resolved
    }
  }
  return null
}

function openCliFileInWindow(argv: string[]): void {
  const cliFile = getCliFile(argv)
  if (!cliFile || !mainWindow) return
  try {
    const content = fs.readFileSync(cliFile, 'utf-8')
    const recentFiles = store.get('recentFiles') as string[]
    const filtered = recentFiles.filter((f) => f !== cliFile)
    filtered.unshift(cliFile)
    store.set('recentFiles', filtered.slice(0, 10))
    store.set('lastOpenedFile', cliFile)
    mainWindow.webContents.send(IPC.FILE_LOADED, { content, filePath: cliFile })
    rebuildMenu(store, mainWindow)
  } catch { /* ignore */ }
}

// Suppress Autofill DevTools noise
app.commandLine.appendSwitch('disable-features', 'Autofill')

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null
const store = new Store<AppConfig>({ defaults: DEFAULT_CONFIG }) as Store<AppConfig>

function createWindow(): void {
  const iconsBase = app.isPackaged
    ? path.join(process.resourcesPath, 'resources', 'icons')
    : path.join(app.getAppPath(), 'resources', 'icons')

  const icon = nativeImage.createFromPath(path.join(iconsBase, '256x256.png'))

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Magnesium',
    icon,
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
    // Priority 1: file passed as CLI argument (launched via file-manager association)
    const cliFile = getCliFile()
    if (cliFile) {
      try {
        const content = fs.readFileSync(cliFile, 'utf-8')
        const recentFiles = store.get('recentFiles') as string[]
        const filtered = recentFiles.filter((f) => f !== cliFile)
        filtered.unshift(cliFile)
        store.set('recentFiles', filtered.slice(0, 10))
        store.set('lastOpenedFile', cliFile)
        mainWindow?.webContents.send(IPC.FILE_LOADED, { content, filePath: cliFile })
        rebuildMenu(store, mainWindow!)
        return
      } catch { /* fall through */ }
    }

    // Priority 2: last opened file from previous session
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

    // Priority 3: welcome document
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

// Image picker — opens a file dialog and returns a base64 data URI
ipcMain.handle(IPC.IMAGE_PICK, async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }],
    properties: ['openFile']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp'
  }
  const mimeType = mimeMap[ext] ?? `image/${ext}`
  const data = fs.readFileSync(filePath)
  const base64 = data.toString('base64')
  const name = path.basename(filePath, path.extname(filePath))
  return { dataUri: `data:${mimeType};base64,${base64}`, name }
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

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    openCliFileInWindow(argv)
  })

  app.whenReady().then(async () => {
    await initStylesFolder(app.getPath('userData'))
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

void dialog
void ipcMain
