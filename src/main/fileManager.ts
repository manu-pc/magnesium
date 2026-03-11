import { ipcMain, dialog, BrowserWindow, Menu, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import Store from 'electron-store'
import {
  IPC, AppConfig, DEFAULT_CONFIG, DEFAULT_PDF_EXPORT, DEFAULT_STYLES,
  StyleManifest, MarkdownStyles, CustomFormatRule
} from '../shared/types'
import { t } from '../shared/i18n'

// ---- Built-in preset data for styles/ folder initialization ----

const SYS_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const SYS_MONO = "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace"
const GEO_SERIF = "Georgia, serif"
const SEGOE = "'Segoe UI', system-ui, sans-serif"
const FIRA_CODE = "'Fira Code', monospace"
const SOURCE_SANS = "'Source Sans Pro', sans-serif"
const SOURCE_CODE = "'Source Code Pro', monospace"
const COURIER = "'Courier New', Courier, monospace"
const CONSOLAS = "Consolas, 'Courier New', monospace"

type BuiltinPreset = {
  version: number
  name: string
  builtIn: true
  impliedTheme: 'light' | 'dark'
  markdownStyles: MarkdownStyles
  customRules: CustomFormatRule[]
}

const BUILTIN_PRESETS: Record<string, BuiltinPreset> = {
  'default.json': {
    version: 2,
    name: 'Classic',
    builtIn: true,
    impliedTheme: 'light',
    customRules: [],
    markdownStyles: DEFAULT_STYLES
  },
  'github.json': {
    version: 1,
    name: 'GitHub',
    builtIn: true,
    impliedTheme: 'light',
    customRules: [],
    markdownStyles: {
      h1: { fontFamily: SYS_SANS, fontSize: 32, fontWeight: 'bold', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.25, marginBottom: 16, borderBottom: '1px solid #d1d9e0' },
      h2: { fontFamily: SYS_SANS, fontSize: 24, fontWeight: 'bold', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.25, marginBottom: 16, borderBottom: '1px solid #d1d9e0' },
      h3: { fontFamily: SYS_SANS, fontSize: 20, fontWeight: 'bold', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.25, marginBottom: 16 },
      h4: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.25, marginBottom: 16 },
      paragraph: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.6, marginBottom: 16 },
      bold: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.6, marginBottom: 0 },
      italic: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#1f2328', lineHeight: 1.6, marginBottom: 0 },
      inlineCode: { fontFamily: CONSOLAS, fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.5, marginBottom: 0, backgroundColor: '#f6f8fa' },
      codeBlock: { fontFamily: CONSOLAS, fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.45, marginBottom: 16, backgroundColor: '#f6f8fa' },
      blockquote: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#57606a', lineHeight: 1.6, marginBottom: 16, backgroundColor: '#f6f8fa' },
      unorderedList: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.6, marginBottom: 4, listStyleType: 'disc', listIndent: 24 },
      orderedList: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.6, marginBottom: 4, listStyleType: 'decimal', listIndent: 24 },
      link: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#0969da', lineHeight: 1.6, marginBottom: 0 }
    }
  },
  'latex.json': {
    version: 1,
    name: 'LaTeX',
    builtIn: true,
    impliedTheme: 'light',
    customRules: [],
    markdownStyles: {
      h1: { fontFamily: GEO_SERIF, fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', color: '#000000', lineHeight: 1.4, marginBottom: 12, textTransform: 'uppercase' },
      h2: { fontFamily: GEO_SERIF, fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#000000', lineHeight: 1.4, marginBottom: 10 },
      h3: { fontFamily: GEO_SERIF, fontSize: 14, fontWeight: 'bold', fontStyle: 'italic', color: '#000000', lineHeight: 1.4, marginBottom: 8 },
      h4: { fontFamily: GEO_SERIF, fontSize: 13, fontWeight: 'bold', fontStyle: 'normal', color: '#000000', lineHeight: 1.4, marginBottom: 8 },
      paragraph: { fontFamily: GEO_SERIF, fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', color: '#000000', lineHeight: 1.8, marginBottom: 12, textAlign: 'justify' },
      bold: { fontFamily: GEO_SERIF, fontSize: 12, fontWeight: 'bold', fontStyle: 'normal', color: '#000000', lineHeight: 1.8, marginBottom: 0 },
      italic: { fontFamily: GEO_SERIF, fontSize: 12, fontWeight: 'normal', fontStyle: 'italic', color: '#000000', lineHeight: 1.8, marginBottom: 0 },
      inlineCode: { fontFamily: COURIER, fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', color: '#000000', lineHeight: 1.5, marginBottom: 0 },
      codeBlock: { fontFamily: COURIER, fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', color: '#000000', lineHeight: 1.5, marginBottom: 12 },
      blockquote: { fontFamily: GEO_SERIF, fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', color: '#333333', lineHeight: 1.6, marginBottom: 12 },
      unorderedList: { fontFamily: GEO_SERIF, fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', color: '#000000', lineHeight: 1.8, marginBottom: 4, listStyleType: 'disc', listIndent: 24 },
      orderedList: { fontFamily: GEO_SERIF, fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', color: '#000000', lineHeight: 1.8, marginBottom: 4, listStyleType: 'decimal', listIndent: 24 },
      link: { fontFamily: GEO_SERIF, fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', color: '#000080', lineHeight: 1.8, marginBottom: 0 }
    }
  },
  'notion.json': {
    version: 1,
    name: 'Notion',
    builtIn: true,
    impliedTheme: 'light',
    customRules: [],
    markdownStyles: {
      h1: { fontFamily: SYS_SANS, fontSize: 40, fontWeight: 'bold', fontStyle: 'normal', color: '#37352f', lineHeight: 1.2, marginBottom: 4 },
      h2: { fontFamily: SYS_SANS, fontSize: 30, fontWeight: 'bold', fontStyle: 'normal', color: '#37352f', lineHeight: 1.3, marginBottom: 4 },
      h3: { fontFamily: SYS_SANS, fontSize: 24, fontWeight: 'bold', fontStyle: 'normal', color: '#37352f', lineHeight: 1.3, marginBottom: 4 },
      h4: { fontFamily: SYS_SANS, fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', color: '#37352f', lineHeight: 1.4, marginBottom: 4 },
      paragraph: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#37352f', lineHeight: 1.6, marginBottom: 4 },
      bold: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#37352f', lineHeight: 1.6, marginBottom: 0 },
      italic: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#37352f', lineHeight: 1.6, marginBottom: 0 },
      inlineCode: { fontFamily: SOURCE_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#eb5757', lineHeight: 1.5, marginBottom: 0, backgroundColor: '#f1f1ef' },
      codeBlock: { fontFamily: SOURCE_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#37352f', lineHeight: 1.6, marginBottom: 8, backgroundColor: '#f1f1ef' },
      blockquote: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#6b6b6b', lineHeight: 1.6, marginBottom: 8 },
      unorderedList: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#37352f', lineHeight: 1.6, marginBottom: 2, listStyleType: 'disc', listIndent: 24 },
      orderedList: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#37352f', lineHeight: 1.6, marginBottom: 2, listStyleType: 'decimal', listIndent: 24 },
      link: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#2eaadc', lineHeight: 1.6, marginBottom: 0 }
    }
  },
  'dracula.json': {
    version: 1,
    name: 'Dracula',
    builtIn: true,
    impliedTheme: 'dark',
    customRules: [],
    markdownStyles: {
      h1: { fontFamily: SEGOE, fontSize: 32, fontWeight: 'bold', fontStyle: 'normal', color: '#bd93f9', lineHeight: 1.3, marginBottom: 20 },
      h2: { fontFamily: SEGOE, fontSize: 26, fontWeight: 'bold', fontStyle: 'normal', color: '#ff79c6', lineHeight: 1.35, marginBottom: 16 },
      h3: { fontFamily: SEGOE, fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', color: '#8be9fd', lineHeight: 1.4, marginBottom: 14 },
      h4: { fontFamily: SEGOE, fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', color: '#f1fa8c', lineHeight: 1.4, marginBottom: 12 },
      paragraph: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 16 },
      bold: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 0 },
      italic: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 0 },
      inlineCode: { fontFamily: FIRA_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#50fa7b', lineHeight: 1.5, marginBottom: 0, backgroundColor: '#2c2f3a' },
      codeBlock: { fontFamily: FIRA_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.6, marginBottom: 16, backgroundColor: '#1e1f29' },
      blockquote: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#6272a4', lineHeight: 1.7, marginBottom: 16, backgroundColor: '#2c2f3a' },
      unorderedList: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 8, listStyleType: 'disc', listIndent: 24 },
      orderedList: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 8, listStyleType: 'decimal', listIndent: 24 },
      link: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#8be9fd', lineHeight: 1.7, marginBottom: 0 }
    }
  },
  'solarized.json': {
    version: 1,
    name: 'Solarized Light',
    builtIn: true,
    impliedTheme: 'light',
    customRules: [],
    markdownStyles: {
      h1: { fontFamily: GEO_SERIF, fontSize: 32, fontWeight: 'bold', fontStyle: 'normal', color: '#268bd2', lineHeight: 1.3, marginBottom: 20 },
      h2: { fontFamily: GEO_SERIF, fontSize: 26, fontWeight: 'bold', fontStyle: 'normal', color: '#2aa198', lineHeight: 1.35, marginBottom: 16 },
      h3: { fontFamily: GEO_SERIF, fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', color: '#859900', lineHeight: 1.4, marginBottom: 14 },
      h4: { fontFamily: GEO_SERIF, fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', color: '#b58900', lineHeight: 1.4, marginBottom: 12 },
      paragraph: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#657b83', lineHeight: 1.7, marginBottom: 16 },
      bold: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#586e75', lineHeight: 1.7, marginBottom: 0 },
      italic: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#657b83', lineHeight: 1.7, marginBottom: 0 },
      inlineCode: { fontFamily: SOURCE_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#cb4b16', lineHeight: 1.5, marginBottom: 0, backgroundColor: '#eee8d5' },
      codeBlock: { fontFamily: SOURCE_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#657b83', lineHeight: 1.6, marginBottom: 16, backgroundColor: '#eee8d5' },
      blockquote: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#839496', lineHeight: 1.7, marginBottom: 16, backgroundColor: '#f0ece3' },
      unorderedList: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#657b83', lineHeight: 1.7, marginBottom: 8, listStyleType: 'disc', listIndent: 24 },
      orderedList: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#657b83', lineHeight: 1.7, marginBottom: 8, listStyleType: 'decimal', listIndent: 24 },
      link: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#268bd2', lineHeight: 1.7, marginBottom: 0 }
    }
  },
  'magnesium.json': {
    version: 2,
    name: 'Magnesium',
    builtIn: true,
    impliedTheme: 'light',
    customRules: [
      { id: 'mml9kwb0', name: 'Pros', triggerType: 'list-marker', trigger: '+', markerSymbol: '✓', enabled: true,
        style: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#21691c', lineHeight: 1.6, marginBottom: 0 } },
      { id: 'mml9lwsw', name: 'Cons', triggerType: 'list-marker', trigger: '-', markerSymbol: '✗', enabled: true,
        style: { fontFamily: "'Trebuchet MS', sans-serif", fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#972d21', lineHeight: 1.6, marginBottom: 0 } },
      { id: 'mml9nfha', name: 'dark mode word', triggerType: 'inline-regex', trigger: '/\\bdark mode\\b/i', enabled: true,
        style: { fontFamily: "'Trebuchet MS', sans-serif", fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#aa8112', lineHeight: 1.6, marginBottom: 0 } },
      { id: 'mml9o4jk', name: 'pi', triggerType: 'char-replace', trigger: '[pi]', replacement: 'π', scope: 'outside-code', enabled: true,
        style: { fontFamily: "'Trebuchet MS', sans-serif", fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#000000', lineHeight: 1.6, marginBottom: 0 } },
      { id: 'mml9pa1p', name: 'smirk cat', triggerType: 'char-replace', trigger: 'smirkcat', replacement: '😼', scope: 'outside-code', enabled: true,
        style: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#000000', lineHeight: 1.6, marginBottom: 0 } },
      { id: 'mml9qnwc', name: 'highlighted line', triggerType: 'line-prefix', trigger: 'º', enabled: true,
        style: { fontFamily: "'Trebuchet MS', sans-serif", fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#123aaa', lineHeight: 1.6, marginBottom: 0 } },
      { id: 'mml9sdpb', name: 'este son eu!', triggerType: 'inline-regex', trigger: '/\\bmanu\\+pc\\b/i', enabled: true,
        style: { fontFamily: "'Trebuchet MS', sans-serif", fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#3512aa', lineHeight: 1.6, marginBottom: 0 } },
      { id: 'mml9vl53', name: 'gear', triggerType: 'char-replace', trigger: '[gear]', replacement: '⚙️', scope: 'outside-code', enabled: true,
        style: { fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#e74c3c', lineHeight: 1.6, marginBottom: 0 } }
    ] as CustomFormatRule[],
    markdownStyles: {
      h1:           { fontFamily: "'Trebuchet MS', sans-serif", fontSize: 35, fontWeight: 'bold',   fontStyle: 'normal', color: '#012388', lineHeight: 1.3,  marginBottom: 24 },
      h2:           { fontFamily: "'Trebuchet MS', sans-serif", fontSize: 23, fontWeight: 'bold',   fontStyle: 'normal', color: '#123aaa', lineHeight: 1.35, marginBottom: 20 },
      h3:           { fontFamily: "'Trebuchet MS', sans-serif", fontSize: 20, fontWeight: 'normal', fontStyle: 'normal', color: '#123bbb', lineHeight: 1.4,  marginBottom: 16 },
      h4:           { fontFamily: 'Georgia, serif',             fontSize: 18, fontWeight: 'normal', fontStyle: 'italic', color: '#123ccc', lineHeight: 1.4,  marginBottom: 14 },
      paragraph:    { fontFamily: "'Trebuchet MS', sans-serif", fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#2d2d2d', lineHeight: 1.7,  marginBottom: 16 },
      bold:         { fontFamily: SYS_SANS,                     fontSize: 16, fontWeight: 'bold',   fontStyle: 'normal', color: '#886312', lineHeight: 1.7,  marginBottom: 0 },
      italic:       { fontFamily: SYS_SANS,                     fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#5c5c5c', lineHeight: 1.7,  marginBottom: 0 },
      inlineCode:   { fontFamily: SYS_MONO,                     fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#c7254e', lineHeight: 1.5,  marginBottom: 0,  backgroundColor: '#f3f3f3' },
      codeBlock:    { fontFamily: SYS_MONO,                     fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#ffffff', lineHeight: 1.6,  marginBottom: 16, backgroundColor: '#45516e' },
      blockquote:   { fontFamily: SYS_SANS,                     fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#8000ff', lineHeight: 1.7,  marginBottom: 16 },
      unorderedList:{ fontFamily: SYS_SANS,                     fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#141414', lineHeight: 1.7,  marginBottom: 8,  listStyleType: 'disc',    listIndent: 24, listStyleColor: '#123aaa' },
      orderedList:  { fontFamily: SYS_SANS,                     fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#2d2d2d', lineHeight: 1.0,  marginBottom: 15, listStyleType: 'decimal', listIndent: 16, listStyleColor: '#123aaa' },
      link:         { fontFamily: SYS_SANS,                     fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#AA8112', lineHeight: 1.7,  marginBottom: 0 }
    }
  }
}

// ---- Styles folder initialization ----

const OBSOLETE_PRESETS = ['magnesium-2.json']

export async function initStylesFolder(userDataPath: string): Promise<void> {
  const stylesDir = path.join(userDataPath, 'styles')
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true })
  }
  for (const [filename, preset] of Object.entries(BUILTIN_PRESETS)) {
    const filePath = path.join(stylesDir, filename)
    let shouldWrite = !fs.existsSync(filePath)
    if (!shouldWrite) {
      try {
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        if ((existing.version ?? 0) < preset.version) shouldWrite = true
      } catch { shouldWrite = true }
    }
    if (shouldWrite) {
      fs.writeFileSync(filePath, JSON.stringify(preset, null, 2), 'utf-8')
    }
  }
  for (const filename of OBSOLETE_PRESETS) {
    const filePath = path.join(stylesDir, filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
}

// ---- Slug helper ----

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'style'
}

// ---- Migration helpers ----

const OLD_PRESET_MAP: Record<string, string> = {
  'default': 'default.json',
  'github': 'github.json',
  'latex': 'latex.json',
  'notion': 'notion.json',
  'dracula': 'dracula.json',
  'solarized': 'solarized.json'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateConfig(config: Record<string, any>, store: Store<AppConfig>): Record<string, any> {
  // Migration 1: listItem → unorderedList + orderedList
  if (config.markdownStyles?.listItem && !config.markdownStyles?.unorderedList) {
    const listItemData = { ...config.markdownStyles.listItem }
    config.markdownStyles.unorderedList = { ...listItemData, listStyleType: 'disc', listIndent: 24 }
    config.markdownStyles.orderedList = { ...listItemData, listStyleType: 'decimal', listIndent: 24 }
    delete config.markdownStyles.listItem
    store.set('markdownStyles', config.markdownStyles)
  }

  // Migration 2: pdfExport defaults
  if (!config.pdfExport) {
    config.pdfExport = DEFAULT_PDF_EXPORT
    store.set('pdfExport', DEFAULT_PDF_EXPORT)
  }

  // Migration 3: activePreset old ID → filename
  const ap = config.activePreset as string | undefined
  if (ap && !ap.endsWith('.json') && ap !== 'custom') {
    const newAp = OLD_PRESET_MAP[ap] ?? (ap + '.json')
    config.activePreset = newAp
    store.set('activePreset', newAp)
  }

  // Migration 4: language default
  if (!config.language) {
    config.language = 'en'
    store.set('language', 'en')
  }

  return config
}

// ---- IPC handlers ----

export function registerFileHandlers(win: BrowserWindow, store: Store<AppConfig>): void {
  ipcMain.handle(IPC.FILE_OPEN, async (_event, filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const recentFiles = store.get('recentFiles') as string[]
    const filtered = recentFiles.filter((f) => f !== filePath)
    filtered.unshift(filePath)
    store.set('recentFiles', filtered.slice(0, 10))
    store.set('lastOpenedFile', filePath)
    rebuildMenu(store, win)
    return { content, filePath }
  })

  ipcMain.handle(IPC.FILE_SAVE, async (_event, filePath: string, content: string) => {
    fs.writeFileSync(filePath, content, 'utf-8')
  })

  ipcMain.handle(IPC.FILE_SAVE_AS, async (_event, content: string) => {
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }, { name: 'Text', extensions: ['txt'] }]
    })
    if (result.canceled || !result.filePath) return null
    fs.writeFileSync(result.filePath, content, 'utf-8')
    const recentFiles = store.get('recentFiles') as string[]
    const filtered = recentFiles.filter((f) => f !== result.filePath)
    filtered.unshift(result.filePath!)
    store.set('recentFiles', filtered.slice(0, 10))
    store.set('lastOpenedFile', result.filePath)
    rebuildMenu(store, win)
    return { filePath: result.filePath }
  })

  ipcMain.handle(IPC.CONFIG_GET, async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = store.store as Record<string, any>
    return migrateConfig(config, store)
  })

  ipcMain.handle(IPC.CONFIG_SET, async (_event, key: keyof AppConfig, value: unknown) => {
    store.set(key, value)
    win.webContents.send(IPC.CONFIG_CHANGED, store.store)
  })

  ipcMain.handle(IPC.SHOW_OPEN_DIALOG, async () => {
    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return { filePath: result.filePaths[0] }
  })

  ipcMain.handle(IPC.SHOW_SAVE_DIALOG, async () => {
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
    })
    if (result.canceled || !result.filePath) return null
    return { filePath: result.filePath }
  })

  ipcMain.handle(IPC.STYLE_EXPORT, async (_event, { markdownStyles, customRules, name, pdfConfig }: { markdownStyles: unknown; customRules: unknown; name: string; pdfConfig?: unknown }) => {
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'JSON Style', extensions: ['json'] }],
      defaultPath: 'my-style.json'
    })
    if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' }
    const payload = JSON.stringify({
      version: 1,
      name: name || 'Custom Style',
      exportedAt: new Date().toISOString(),
      markdownStyles,
      customRules,
      ...(pdfConfig ? { pdfConfig } : {})
    }, null, 2)
    fs.writeFileSync(result.filePath, payload, 'utf-8')
    return { success: true, path: result.filePath }
  })

  ipcMain.handle(IPC.STYLE_IMPORT, async () => {
    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'JSON Style', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { success: false, error: 'Cancelled' }
    try {
      const raw = fs.readFileSync(result.filePaths[0], 'utf-8')
      const parsed = JSON.parse(raw)
      if (!parsed.version || !parsed.markdownStyles) {
        return { success: false, error: 'Invalid style file' }
      }
      return {
        success: true,
        markdownStyles: parsed.markdownStyles,
        customRules: parsed.customRules ?? [],
        name: parsed.name ?? 'Imported Style',
        pdfConfig: parsed.pdfConfig ?? null
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // ---- Styles folder IPC handlers ----

  ipcMain.handle(IPC.STYLES_LIST, async () => {
    const stylesDir = path.join(app.getPath('userData'), 'styles')
    if (!fs.existsSync(stylesDir)) {
      await initStylesFolder(app.getPath('userData'))
    }
    const files = fs.readdirSync(stylesDir).filter((f) => f.endsWith('.json'))
    const manifests: StyleManifest[] = []
    for (const filename of files) {
      try {
        const raw = fs.readFileSync(path.join(stylesDir, filename), 'utf-8')
        const parsed = JSON.parse(raw)
        if (!parsed.version || !parsed.markdownStyles) continue
        manifests.push({ ...parsed, filename })
      } catch (err) {
        console.warn(`[Styles] Failed to parse ${filename}:`, err)
      }
    }
    manifests.sort((a, b) => {
      if (a.builtIn && !b.builtIn) return -1
      if (!a.builtIn && b.builtIn) return 1
      return a.name.localeCompare(b.name)
    })
    return manifests
  })

  ipcMain.handle(IPC.STYLES_SAVE_NEW, async (_event, style: { name: string; markdownStyles: MarkdownStyles; customRules: CustomFormatRule[] }) => {
    const stylesDir = path.join(app.getPath('userData'), 'styles')
    if (!fs.existsSync(stylesDir)) fs.mkdirSync(stylesDir, { recursive: true })

    const base = slugify(style.name)
    let filename = `${base}.json`
    let counter = 2
    while (fs.existsSync(path.join(stylesDir, filename))) {
      filename = `${base}-${counter}.json`
      counter++
    }

    const payload = {
      version: 1,
      name: style.name,
      builtIn: false,
      markdownStyles: style.markdownStyles,
      customRules: style.customRules
    }
    fs.writeFileSync(path.join(stylesDir, filename), JSON.stringify(payload, null, 2), 'utf-8')
    return { filename }
  })

  ipcMain.handle(IPC.STYLES_DELETE, async (_event, filename: string) => {
    const stylesDir = path.join(app.getPath('userData'), 'styles')
    const filePath = path.join(stylesDir, filename)
    if (!fs.existsSync(filePath)) return { success: false }
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (parsed.builtIn) return { success: false }
      fs.unlinkSync(filePath)
      return { success: true }
    } catch {
      return { success: false }
    }
  })

  ipcMain.handle(IPC.STYLES_UPDATE, async (_event, { filename, markdownStyles, customRules }: { filename: string; markdownStyles: MarkdownStyles; customRules: CustomFormatRule[] }) => {
    const stylesDir = path.join(app.getPath('userData'), 'styles')
    const filePath = path.join(stylesDir, filename)
    if (!fs.existsSync(filePath)) return { success: false }
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      parsed.markdownStyles = markdownStyles
      parsed.customRules = customRules
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8')
      return { success: true }
    } catch {
      return { success: false }
    }
  })

  ipcMain.handle(IPC.STYLES_RENAME, async (_event, { filename, newName }: { filename: string; newName: string }) => {
    const stylesDir = path.join(app.getPath('userData'), 'styles')
    const filePath = path.join(stylesDir, filename)
    if (!fs.existsSync(filePath)) return { success: false }
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      parsed.name = newName
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8')
      return { success: true }
    } catch {
      return { success: false }
    }
  })
}

export function rebuildMenu(store: Store<AppConfig>, win: BrowserWindow): void {
  const recentFiles = store.get('recentFiles') as string[]
  const recentMenuItems = recentFiles.map((filePath) => ({
    label: path.basename(filePath),
    click: () => {
      const content = fs.readFileSync(filePath, 'utf-8')
      win.webContents.send(IPC.FILE_LOADED, { content, filePath })
    }
  }))

  const menu = Menu.buildFromTemplate([
    {
      label: t('menu.file'),
      submenu: [
        { label: t('menu.file.new'), accelerator: 'CmdOrCtrl+N', click: () => win.webContents.send(IPC.FILE_LOADED, { content: '', filePath: null }) },
        {
          label: t('menu.file.open'), accelerator: 'CmdOrCtrl+O', click: async () => {
            const result = await dialog.showOpenDialog(win, {
              filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
              properties: ['openFile']
            })
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0]
              const content = fs.readFileSync(filePath, 'utf-8')
              const recentFiles2 = store.get('recentFiles') as string[]
              const filtered = recentFiles2.filter((f) => f !== filePath)
              filtered.unshift(filePath)
              store.set('recentFiles', filtered.slice(0, 10))
              store.set('lastOpenedFile', filePath)
              win.webContents.send(IPC.FILE_LOADED, { content, filePath })
              rebuildMenu(store, win)
            }
          }
        },
        { type: 'separator' },
        { label: t('menu.file.save'), accelerator: 'CmdOrCtrl+S', click: () => win.webContents.send('menu:save') },
        { label: t('menu.file.saveAs'), accelerator: 'CmdOrCtrl+Shift+S', click: () => win.webContents.send('menu:save-as') },
        { type: 'separator' },
        {
          label: t('menu.file.recentFiles'),
          submenu: recentMenuItems.length > 0 ? recentMenuItems : [{ label: t('menu.file.noRecent'), enabled: false }]
        },
        { type: 'separator' },
        { label: t('menu.file.exportPdf'), accelerator: 'CmdOrCtrl+Shift+E', click: () => win.webContents.send('menu:export-pdf') },
        { type: 'separator' },
        { label: t('menu.file.quit'), accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: t('menu.edit'),
      submenu: [
        { label: t('menu.edit.undo'), accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: t('menu.edit.redo'), accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: t('menu.edit.cut'), accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: t('menu.edit.copy'), accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: t('menu.edit.paste'), accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: t('menu.edit.selectAll'), accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: t('menu.view'),
      submenu: [
        { label: t('menu.view.toggleDarkMode'), accelerator: 'CmdOrCtrl+Shift+D', click: () => win.webContents.send('menu:toggle-dark-mode') },
        { label: t('menu.view.settings'), accelerator: 'CmdOrCtrl+,', click: () => win.webContents.send('menu:settings') },
        { type: 'separator' },
        { label: t('menu.view.reload'), accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: t('menu.view.devTools'), accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' }
      ]
    },
    {
      label: t('menu.help'),
      submenu: [
        { label: t('menu.help.about'), click: () => win.webContents.send('menu:about') }
      ]
    }
  ])

  Menu.setApplicationMenu(menu)
}

void DEFAULT_CONFIG
void SYS_MONO
