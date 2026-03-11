import './styles/main.css'
import './styles/preview.css'
import { initEditor } from './editor/editorSetup'
import { updatePreview, renderToHTMLString } from './preview/previewRenderer'
import { initSettingsPanel, openPanel, closePanel } from './settings/settingsPanel'
import { openAboutDialog } from './about/aboutDialog'
import { setLanguage } from '../shared/i18n'
import type { AppConfig, MarkdownStyles, CustomFormatRule, PdfExportConfig, WindowAPI } from '../shared/types'
import { DEFAULT_PDF_EXPORT } from '../shared/types'

declare global {
  interface Window {
    electronAPI: WindowAPI & {
      onMenuEvent: (event: string, callback: () => void) => (...args: unknown[]) => void
      offMenuEvent: (event: string, wrapper: (...args: unknown[]) => void) => void
      exportStyle: (markdownStyles: unknown, customRules: unknown, name: string) => Promise<{ success: boolean; path?: string; error?: string }>
      importStyle: () => Promise<{ success: boolean; markdownStyles?: MarkdownStyles; customRules?: CustomFormatRule[]; name?: string; error?: string }>
    }
  }
}

let currentContent = ''
let currentPath: string | null = null
let isDirty = false
let currentConfig: AppConfig
let editorInstance: ReturnType<typeof initEditor>

async function main(): Promise<void> {
  currentConfig = await window.electronAPI.getConfig()
  if (!currentConfig.customRules) currentConfig.customRules = []
  if (!currentConfig.activePreset) currentConfig.activePreset = 'default.json'
  if (!currentConfig.pdfExport) currentConfig.pdfExport = { ...DEFAULT_PDF_EXPORT }
  if (!currentConfig.language) currentConfig.language = 'en'

  setLanguage(currentConfig.language)

  document.documentElement.dataset.theme = currentConfig.theme
  setHighlightCSS(currentConfig.theme)

  const editorContainer = document.getElementById('editor-pane')!
  editorInstance = initEditor(currentConfig, editorContainer, onEditorChange)

  const previewContainer = document.getElementById('preview-content')!

  initSettingsPanel(currentConfig, onStylesChange)
  initSplitter(currentConfig.previewWidth)
  initToolbar()
  registerIPCListeners()
  document.addEventListener('keydown', handleKeydown)
  updateWindowTitle()
}

function onEditorChange(content: string): void {
  currentContent = content
  isDirty = true
  updateWindowTitle()
  const previewContainer = document.getElementById('preview-content')!
  updatePreview(content, currentConfig.markdownStyles, previewContainer, currentConfig.theme, currentConfig.customRules)
}

async function onStylesChange(newStyles: MarkdownStyles, newRules?: CustomFormatRule[]): Promise<void> {
  currentConfig.markdownStyles = newStyles
  if (newRules !== undefined) currentConfig.customRules = newRules
  const previewContainer = document.getElementById('preview-content')!
  await updatePreview(currentContent, newStyles, previewContainer, currentConfig.theme, currentConfig.customRules)
}

function applyTheme(newTheme: 'light' | 'dark'): void {
  currentConfig.theme = newTheme
  document.documentElement.dataset.theme = newTheme
  setHighlightCSS(newTheme)
  editorInstance.reconfigureTheme({ ...currentConfig, theme: newTheme })
  window.electronAPI.setConfig('theme', newTheme)
  const previewContainer = document.getElementById('preview-content')!
  updatePreview(currentContent, currentConfig.markdownStyles, previewContainer, newTheme, currentConfig.customRules)
}

function updateWindowTitle(): void {
  const filename = currentPath
    ? currentPath.split('/').pop() || currentPath.split('\\').pop() || 'Untitled'
    : 'Untitled'
  const dirtyMarker = isDirty ? '• ' : ''
  document.title = `${dirtyMarker}${filename} — Magnesium`
}

function setHighlightCSS(theme: 'light' | 'dark'): void {
  const link = document.getElementById('highlight-css') as HTMLLinkElement
  if (theme === 'dark') {
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
  } else {
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
  }
}

function initToolbar(): void {
  const toolbar = document.getElementById('toolbar')!
  toolbar.innerHTML = `
    <button class="toolbar-btn" id="btn-new" title="New (Ctrl+N)">&#x1F4C4;</button>
    <button class="toolbar-btn" id="btn-open" title="Open (Ctrl+O)">&#x1F4C2;</button>
    <button class="toolbar-btn" id="btn-save" title="Save (Ctrl+S)">&#x1F4BE;</button>
    <div class="toolbar-separator"></div>
    <button class="toolbar-btn" id="btn-export-pdf" title="Export PDF (Ctrl+Shift+E)">&#x1F4D1;</button>
    <div class="toolbar-separator"></div>
    <button class="toolbar-btn" id="btn-dark-mode" title="Toggle Dark Mode (Ctrl+Shift+D)">&#x1F319;</button>
    <button class="toolbar-btn" id="btn-settings" title="Settings (Ctrl+,)">&#x2699;&#xFE0F;</button>
  `
  document.getElementById('btn-new')!.addEventListener('click', newFile)
  document.getElementById('btn-open')!.addEventListener('click', openFile)
  document.getElementById('btn-save')!.addEventListener('click', saveFile)
  document.getElementById('btn-export-pdf')!.addEventListener('click', exportPDF)
  document.getElementById('btn-dark-mode')!.addEventListener('click', toggleDarkMode)
  document.getElementById('btn-settings')!.addEventListener('click', () => { openPanel() })
}

async function newFile(): Promise<void> {
  if (isDirty) {
    const confirmed = await window.electronAPI.showDiscardDialog()
    if (!confirmed) return
  }
  currentContent = ''
  currentPath = null
  isDirty = false
  editorInstance.setContent('')
  const previewContainer = document.getElementById('preview-content')!
  await updatePreview('', currentConfig.markdownStyles, previewContainer, currentConfig.theme, currentConfig.customRules)
  updateWindowTitle()
}

async function openFile(): Promise<void> {
  const result = await window.electronAPI.showOpenDialog()
  if (!result) return
  const fileData = await window.electronAPI.openFile(result.filePath)
  loadFileData(fileData)
}

function loadFileData(data: { content: string; filePath: string | null }): void {
  currentContent = data.content || ''
  currentPath = data.filePath
  isDirty = false
  editorInstance.setContent(currentContent)
  const previewContainer = document.getElementById('preview-content')!
  updatePreview(currentContent, currentConfig.markdownStyles, previewContainer, currentConfig.theme, currentConfig.customRules)
  updateWindowTitle()
}

async function saveFile(): Promise<void> {
  if (!currentPath) { await saveFileAs(); return }
  await window.electronAPI.saveFile(currentPath, currentContent)
  isDirty = false
  updateWindowTitle()
}

async function saveFileAs(): Promise<void> {
  const result = await window.electronAPI.saveFileAs(currentContent)
  if (result) { currentPath = result.filePath; isDirty = false; updateWindowTitle() }
}

async function exportPDF(): Promise<void> {
  const pdfConfig: PdfExportConfig = currentConfig.pdfExport ?? DEFAULT_PDF_EXPORT
  const htmlString = await renderToHTMLString(currentContent, currentConfig.markdownStyles, currentConfig.customRules)
  const result = await window.electronAPI.exportPdf(htmlString, pdfConfig)
  if ('error' in result && result.error !== 'Cancelled') {
    alert(`PDF export failed: ${result.error}`)
  }
}

function toggleDarkMode(): void {
  const isDark = document.documentElement.dataset.theme === 'dark'
  applyTheme(isDark ? 'light' : 'dark')
}

function initSplitter(initialWidth: number): void {
  const splitter = document.getElementById('splitter')!
  const editorPane = document.getElementById('editor-pane')!
  const workspace = document.getElementById('workspace')!

  editorPane.style.flex = `0 0 ${initialWidth}%`

  let dragging = false
  let startX = 0
  let startFlex = initialWidth

  splitter.addEventListener('mousedown', (e) => {
    dragging = true
    startX = e.clientX
    startFlex = parseFloat(editorPane.style.flex.split(' ')[2]) || initialWidth
    splitter.classList.add('dragging')
    workspace.style.pointerEvents = 'none'
    workspace.style.userSelect = 'none'
    e.preventDefault()
  })

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return
    const delta = e.clientX - startX
    const newPct = Math.max(20, Math.min(80, startFlex + (delta / workspace.clientWidth) * 100))
    editorPane.style.flex = `0 0 ${newPct}%`
  })

  document.addEventListener('mouseup', () => {
    if (!dragging) return
    dragging = false
    splitter.classList.remove('dragging')
    workspace.style.pointerEvents = ''
    workspace.style.userSelect = ''
    const currentPct = parseFloat(editorPane.style.flex.split(' ')[2]) || 50
    window.electronAPI.setConfig('previewWidth', currentPct)
  })
}

function registerIPCListeners(): void {
  window.electronAPI.onFileLoaded((data) => loadFileData(data))

  window.electronAPI.onWindowBeforeClose(async () => {
    if (!isDirty) { window.electronAPI.confirmClose(); return }
    const choice = await window.electronAPI.showCloseDialog()
    if (choice === 'save') {
      await saveFile()
      window.electronAPI.confirmClose()
    } else if (choice === 'discard') {
      window.electronAPI.confirmClose()
    } else {
      window.electronAPI.cancelClose()
    }
  })

  window.electronAPI.onConfigChanged((newConfig) => {
    currentConfig = newConfig
    if (!currentConfig.pdfExport) currentConfig.pdfExport = { ...DEFAULT_PDF_EXPORT }
  })

  window.electronAPI.onMenuEvent('menu:save', saveFile)
  window.electronAPI.onMenuEvent('menu:save-as', saveFileAs)
  window.electronAPI.onMenuEvent('menu:export-pdf', exportPDF)
  window.electronAPI.onMenuEvent('menu:toggle-dark-mode', toggleDarkMode)
  window.electronAPI.onMenuEvent('menu:settings', () => { openPanel() })
  window.electronAPI.onMenuEvent('menu:about', () => { openAboutDialog() })
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'n': case 'N': e.preventDefault(); newFile(); break
      case 'o': case 'O': e.preventDefault(); openFile(); break
      case 's': case 'S': e.preventDefault(); e.shiftKey ? saveFileAs() : saveFile(); break
      case ',': e.preventDefault(); openPanel(); break
    }
  }
}

void closePanel

// ---- Error boundary ----
main().catch((err) => {
  console.error('[Magnesium] Fatal error:', err)
  document.body.innerHTML = `
    <div style="
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      height:100vh;font-family:system-ui,sans-serif;color:#1a1a1a;background:#fff;
      gap:16px;padding:40px;text-align:center;
    ">
      <div style="font-size:48px;">⚠️</div>
      <h2 style="font-size:20px;font-weight:600;margin:0;">Magnesium encountered an error</h2>
      <pre style="
        background:#f6f8fa;padding:16px;border-radius:8px;font-size:12px;
        max-width:600px;overflow:auto;text-align:left;border:1px solid #e0e0e0;
      ">${String(err)}</pre>
      <button onclick="location.reload()" style="
        padding:10px 24px;background:#2563eb;color:#fff;border:none;
        border-radius:6px;font-size:14px;cursor:pointer;font-weight:500;
      ">Reload</button>
    </div>
  `
})
