import './styles/main.css'
import './styles/preview.css'
import githubCss from 'highlight.js/styles/github.min.css?inline'
import githubDarkCss from 'highlight.js/styles/github-dark.min.css?inline'
import { initEditor, detectLanguage } from './editor/editorSetup'
import type { FileLanguage, EditorInstance } from './editor/editorSetup'
import { updatePreview, updateCodePreview, renderToHTMLString } from './preview/previewRenderer'
import { initSettingsPanel, openPanel, closePanel } from './settings/settingsPanel'
import { openAboutDialog } from './about/aboutDialog'
import { setLanguage } from '../shared/i18n'
import type { AppConfig, MarkdownStyles, CustomFormatRule, PdfExportConfig, WindowAPI } from '../shared/types'
import { DEFAULT_PDF_EXPORT } from '../shared/types'
import { generateSyntaxColorsCSS } from './settings/styleEngine'
import { DEFAULT_SYNTAX_COLORS } from './editor/syntaxTheme'

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
let currentLanguage: FileLanguage = 'markdown'
let isDirty = false
let currentConfig: AppConfig
let editorInstance: EditorInstance
let tocVisible = false
let splitterControls: { setPreviewCollapsed: (collapsed: boolean) => void } | null = null

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

  initSettingsPanel(currentConfig, onStylesChange)
  splitterControls = initSplitter(currentConfig.previewWidth)
  initToolbar()
  initTOC()
  registerIPCListeners()
  document.addEventListener('keydown', handleKeydown)
  updateWindowTitle()
}

function onEditorChange(content: string): void {
  currentContent = content
  isDirty = true
  updateWindowTitle()
  const previewContainer = document.getElementById('preview-content')!
  if (currentLanguage === 'markdown') {
    updatePreview(content, currentConfig.markdownStyles, previewContainer, currentConfig.theme, currentConfig.customRules)
  } else {
    updateCodePreview(content, currentLanguage, previewContainer, currentConfig.theme)
  }
  if (tocVisible) updateTOC()
}

async function onStylesChange(newStyles: MarkdownStyles, newRules?: CustomFormatRule[]): Promise<void> {
  currentConfig.markdownStyles = newStyles
  if (newRules !== undefined) currentConfig.customRules = newRules
  const previewContainer = document.getElementById('preview-content')!
  if (currentLanguage === 'markdown') {
    await updatePreview(currentContent, newStyles, previewContainer, currentConfig.theme, currentConfig.customRules)
  }
}

function applyTheme(newTheme: 'light' | 'dark'): void {
  currentConfig.theme = newTheme
  document.documentElement.dataset.theme = newTheme
  setHighlightCSS(newTheme)
  editorInstance.reconfigureTheme({ ...currentConfig, theme: newTheme })
  window.electronAPI.setConfig('theme', newTheme)
  const previewContainer = document.getElementById('preview-content')!
  if (currentLanguage === 'markdown') {
    updatePreview(currentContent, currentConfig.markdownStyles, previewContainer, newTheme, currentConfig.customRules)
  } else {
    updateCodePreview(currentContent, currentLanguage, previewContainer, newTheme)
  }
}

function updateWindowTitle(): void {
  const filename = currentPath
    ? currentPath.split('/').pop() || currentPath.split('\\').pop() || 'Untitled'
    : 'Untitled'
  const dirtyMarker = isDirty ? '• ' : ''
  document.title = `${dirtyMarker}${filename} — Magnesium`
}

function setHighlightCSS(theme: 'light' | 'dark'): void {
  let styleEl = document.getElementById('highlight-css') as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'highlight-css'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = theme === 'dark' ? githubDarkCss : githubCss
  applySyntaxColorsCSS(theme)
}

function applySyntaxColorsCSS(theme: 'light' | 'dark'): void {
  let styleEl = document.getElementById('syntax-colors-override')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'syntax-colors-override'
    document.head.appendChild(styleEl)
  }
  // Only override in light mode — dark mode uses the CDN github-dark theme
  if (theme === 'dark') {
    styleEl.textContent = ''
    return
  }
  const colors = currentConfig?.syntaxColors ?? DEFAULT_SYNTAX_COLORS
  styleEl.textContent = generateSyntaxColorsCSS(colors)
}

// ---- TOC (Header Index) ----

function initTOC(): void {
  const tocPanel = document.getElementById('toc-panel')!
  tocPanel.innerHTML = `
    <div class="toc-header">
      <span class="toc-title">Contents</span>
      <button class="toc-close-btn" id="toc-close-btn" title="Close">✕</button>
    </div>
    <div class="toc-body" id="toc-body"></div>
  `
  document.getElementById('toc-close-btn')!.addEventListener('click', toggleTOC)
}

function updateTOC(): void {
  const tocBody = document.getElementById('toc-body')!
  if (currentLanguage !== 'markdown') {
    tocBody.innerHTML = '<p class="toc-empty">TOC available for Markdown only</p>'
    return
  }

  const headerRegex = /^(#{1,6})\s+(.+)$/gm
  const headers: { level: number; text: string; index: number }[] = []
  let match: RegExpExecArray | null
  let i = 0
  while ((match = headerRegex.exec(currentContent)) !== null) {
    headers.push({ level: match[1].length, text: match[2].trim(), index: i++ })
  }

  if (headers.length === 0) {
    tocBody.innerHTML = '<p class="toc-empty">No headers found</p>'
    return
  }

  const minLevel = Math.min(...headers.map(h => h.level))
  tocBody.innerHTML = headers.map(h => {
    const indent = (h.level - minLevel) * 12
    const slug = h.text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    return `<div class="toc-item toc-h${h.level}" style="padding-left:${indent + 8}px" data-slug="${slug}" data-index="${h.index}">
      <span class="toc-bullet"></span>
      <span class="toc-text">${escapeHtml(h.text)}</span>
    </div>`
  }).join('')

  tocBody.querySelectorAll('.toc-item').forEach(item => {
    item.addEventListener('click', () => {
      const slug = (item as HTMLElement).dataset.slug ?? ''
      const previewPane = document.getElementById('preview-pane')!
      // Try to find heading by id or text content
      const headings = previewPane.querySelectorAll('h1,h2,h3,h4,h5,h6')
      for (const h of headings) {
        const headingSlug = h.textContent!.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
        if (headingSlug === slug || h.id === slug) {
          h.scrollIntoView({ behavior: 'smooth', block: 'start' })
          break
        }
      }
    })
  })
}

function toggleTOC(): void {
  tocVisible = !tocVisible
  const tocPanel = document.getElementById('toc-panel')!
  tocPanel.classList.toggle('open', tocVisible)
  const btn = document.getElementById('btn-toc')!
  btn.classList.toggle('active', tocVisible)
  if (tocVisible) updateTOC()
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ---- Table insertion ----

function showTableDialog(): void {
  const existing = document.getElementById('table-dialog')
  if (existing) { existing.remove(); return }

  const dialog = document.createElement('div')
  dialog.id = 'table-dialog'
  dialog.className = 'table-dialog'
  dialog.innerHTML = `
    <div class="table-dialog-inner">
      <div class="table-dialog-title">Insert Table</div>
      <div class="table-dialog-row">
        <label>Rows</label>
        <input type="number" id="tbl-rows" value="3" min="1" max="20" />
      </div>
      <div class="table-dialog-row">
        <label>Columns</label>
        <input type="number" id="tbl-cols" value="3" min="1" max="10" />
      </div>
      <div class="table-dialog-actions">
        <button class="tbl-cancel-btn" id="tbl-cancel">Cancel</button>
        <button class="tbl-insert-btn" id="tbl-insert">Insert</button>
      </div>
    </div>
  `
  document.body.appendChild(dialog)

  const closeDialog = () => dialog.remove()

  document.getElementById('tbl-cancel')!.addEventListener('click', closeDialog)
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog() })

  document.getElementById('tbl-insert')!.addEventListener('click', () => {
    const rows = parseInt((document.getElementById('tbl-rows') as HTMLInputElement).value) || 3
    const cols = parseInt((document.getElementById('tbl-cols') as HTMLInputElement).value) || 3
    insertTable(rows, cols)
    closeDialog()
  })

  // Focus rows input
  setTimeout(() => (document.getElementById('tbl-rows') as HTMLInputElement)?.focus(), 50)
}

function insertTable(rows: number, cols: number): void {
  const headerCells = Array(cols).fill('Header').map((h, i) => `${h} ${i + 1}`)
  const separator = Array(cols).fill('---')
  const dataRow = Array(cols).fill('Cell')

  const header = `| ${headerCells.join(' | ')} |`
  const sep = `| ${separator.join(' | ')} |`
  const dataRows = Array(rows - 1).fill(`| ${dataRow.join(' | ')} |`)

  const table = [header, sep, ...dataRows].join('\n')

  const view = editorInstance.view
  const selection = view.state.selection.main
  // Insert at cursor, prepend newline if not at start of line
  const line = view.state.doc.lineAt(selection.head)
  const prefix = line.text.trim().length > 0 ? '\n\n' : ''
  const suffix = '\n\n'
  view.dispatch({
    changes: { from: selection.head, insert: prefix + table + suffix },
    selection: { anchor: selection.head + prefix.length + table.length + suffix.length }
  })
  view.focus()
}

// ---- Image insertion ----

async function insertImage(): Promise<void> {
  const result = await window.electronAPI.pickImage()
  if (!result) return
  const { dataUri, name } = result
  const markdown = `![${name}](${dataUri})`
  const view = editorInstance.view
  const selection = view.state.selection.main
  const line = view.state.doc.lineAt(selection.head)
  const prefix = line.text.trim().length > 0 ? '\n\n' : ''
  view.dispatch({
    changes: { from: selection.head, insert: prefix + markdown },
    selection: { anchor: selection.head + prefix.length + markdown.length }
  })
  view.focus()
}

// ---- Toolbar ----

function initToolbar(): void {
  const toolbar = document.getElementById('toolbar')!
  toolbar.innerHTML = `
    <button class="toolbar-btn" id="btn-new" title="New (Ctrl+N)">&#x1F4C4;</button>
    <button class="toolbar-btn" id="btn-open" title="Open (Ctrl+O)">&#x1F4C2;</button>
    <button class="toolbar-btn" id="btn-save" title="Save (Ctrl+S)">&#x1F4BE;</button>
    <div class="toolbar-separator"></div>
    <button class="toolbar-btn" id="btn-search" title="Search / Replace (Ctrl+F)">&#x1F50D;</button>
    <button class="toolbar-btn" id="btn-table" title="Insert Table">&#x229E;</button>
    <button class="toolbar-btn" id="btn-image" title="Insert Image">&#x1F5BC;</button>
    <button class="toolbar-btn" id="btn-toc" title="Header Index">&#x2630;</button>
    <div class="toolbar-separator"></div>
    <span id="file-lang-badge" class="file-lang-badge" style="display:none"></span>
    <div class="toolbar-separator" id="lang-sep" style="display:none"></div>
    <button class="toolbar-btn" id="btn-export-pdf" title="Export PDF (Ctrl+Shift+E)">&#x1F4D1;</button>
    <div class="toolbar-separator"></div>
    <button class="toolbar-btn" id="btn-dark-mode" title="Toggle Dark Mode (Ctrl+Shift+D)">&#x1F319;</button>
    <button class="toolbar-btn" id="btn-settings" title="Settings (Ctrl+,)">&#x2699;&#xFE0F;</button>
  `
  document.getElementById('btn-new')!.addEventListener('click', newFile)
  document.getElementById('btn-open')!.addEventListener('click', openFile)
  document.getElementById('btn-save')!.addEventListener('click', saveFile)
  document.getElementById('btn-search')!.addEventListener('click', () => editorInstance.openSearch())
  document.getElementById('btn-table')!.addEventListener('click', showTableDialog)
  document.getElementById('btn-image')!.addEventListener('click', insertImage)
  document.getElementById('btn-toc')!.addEventListener('click', toggleTOC)
  document.getElementById('btn-export-pdf')!.addEventListener('click', exportPDF)
  document.getElementById('btn-dark-mode')!.addEventListener('click', toggleDarkMode)
  document.getElementById('btn-settings')!.addEventListener('click', () => { openPanel() })
}

function updateLangBadge(): void {
  const badge = document.getElementById('file-lang-badge')!
  const sep = document.getElementById('lang-sep')!
  if (currentLanguage !== 'markdown') {
    badge.textContent = currentLanguage.toUpperCase()
    badge.style.display = 'inline-flex'
    sep.style.display = 'block'
  } else {
    badge.style.display = 'none'
    sep.style.display = 'none'
  }
}

// ---- File operations ----

async function newFile(): Promise<void> {
  if (isDirty) {
    const confirmed = await window.electronAPI.showDiscardDialog()
    if (!confirmed) return
  }
  currentContent = ''
  currentPath = null
  currentLanguage = 'markdown'
  isDirty = false
  editorInstance.setContent('', true)
  editorInstance.setLanguage('markdown')
  updateLangBadge()
  const previewContainer = document.getElementById('preview-content')!
  await updatePreview('', currentConfig.markdownStyles, previewContainer, currentConfig.theme, currentConfig.customRules)
  updateWindowTitle()
  if (tocVisible) updateTOC()
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
  currentLanguage = detectLanguage(currentPath)
  editorInstance.setContent(currentContent, true)
  editorInstance.setLanguage(currentLanguage)
  updateLangBadge()
  splitterControls?.setPreviewCollapsed(currentLanguage !== 'markdown')
  const previewContainer = document.getElementById('preview-content')!
  if (currentLanguage === 'markdown') {
    updatePreview(currentContent, currentConfig.markdownStyles, previewContainer, currentConfig.theme, currentConfig.customRules)
  } else {
    updateCodePreview(currentContent, currentLanguage, previewContainer, currentConfig.theme)
  }
  updateWindowTitle()
  if (tocVisible) updateTOC()
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

function initSplitter(initialWidth: number): { setPreviewCollapsed: (collapsed: boolean) => void } {
  const splitter = document.getElementById('splitter')!
  const editorPane = document.getElementById('editor-pane')!
  const previewPane = document.getElementById('preview-pane')!
  const workspace = document.getElementById('workspace')!

  splitter.innerHTML = `
    <button class="collapse-btn" id="btn-collapse-editor" title="Colapsar editor">&#x25C0;</button>
    <button class="collapse-btn" id="btn-collapse-preview" title="Colapsar vista previa">&#x25B6;</button>
  `

  editorPane.style.flex = `0 0 ${initialWidth}%`

  let dragging = false
  let startX = 0
  let startFlex = initialWidth
  let editorCollapsed = false
  let previewCollapsed = false
  let lastEditorWidth = initialWidth

  function updateCollapseButtons(): void {
    const btnEd = document.getElementById('btn-collapse-editor')!
    const btnPr = document.getElementById('btn-collapse-preview')!
    if (editorCollapsed) {
      btnEd.innerHTML = '&#x25B6;'
      btnEd.title = 'Expandir editor'
    } else {
      btnEd.innerHTML = '&#x25C0;'
      btnEd.title = 'Colapsar editor'
    }
    if (previewCollapsed) {
      btnPr.innerHTML = '&#x25C0;'
      btnPr.title = 'Expandir vista previa'
    } else {
      btnPr.innerHTML = '&#x25B6;'
      btnPr.title = 'Colapsar vista previa'
    }
  }

  function collapseEditor(): void {
    lastEditorWidth = parseFloat(editorPane.style.flex.split(' ')[2]) || lastEditorWidth
    editorCollapsed = true
    editorPane.style.flex = '0 0 0'
    editorPane.style.overflow = 'hidden'
    editorPane.style.minWidth = '0'
    editorPane.style.borderRight = 'none'
  }

  function expandEditor(): void {
    editorCollapsed = false
    editorPane.style.flex = `0 0 ${lastEditorWidth}%`
    editorPane.style.overflow = ''
    editorPane.style.minWidth = ''
    editorPane.style.borderRight = ''
  }

  function collapsePreview(): void {
    lastEditorWidth = parseFloat(editorPane.style.flex.split(' ')[2]) || lastEditorWidth
    previewCollapsed = true
    previewPane.style.flex = '0 0 0'
    previewPane.style.overflow = 'hidden'
    previewPane.style.minWidth = '0'
    previewPane.style.padding = '0'
    editorPane.style.flex = '1 1 auto'
  }

  function expandPreview(): void {
    previewCollapsed = false
    previewPane.style.flex = ''
    previewPane.style.overflow = ''
    previewPane.style.minWidth = ''
    previewPane.style.padding = ''
    editorPane.style.flex = `0 0 ${lastEditorWidth}%`
  }

  document.getElementById('btn-collapse-editor')!.addEventListener('click', (e) => {
    e.stopPropagation()
    if (editorCollapsed) {
      expandEditor()
      if (previewCollapsed) expandPreview()
    } else {
      collapseEditor()
    }
    updateCollapseButtons()
  })

  document.getElementById('btn-collapse-preview')!.addEventListener('click', (e) => {
    e.stopPropagation()
    if (previewCollapsed) {
      expandPreview()
      if (editorCollapsed) expandEditor()
    } else {
      collapsePreview()
    }
    updateCollapseButtons()
  })

  splitter.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('.collapse-btn')) return
    if (editorCollapsed || previewCollapsed) return
    dragging = true
    startX = e.clientX
    startFlex = parseFloat(editorPane.style.flex.split(' ')[2]) || lastEditorWidth
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
    lastEditorWidth = currentPct
    window.electronAPI.setConfig('previewWidth', currentPct)
  })

  return {
    setPreviewCollapsed: (collapsed: boolean) => {
      if (collapsed && !previewCollapsed) {
        collapsePreview()
        updateCollapseButtons()
      } else if (!collapsed && previewCollapsed) {
        expandPreview()
        updateCollapseButtons()
      }
    }
  }
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
    // Reapply editor theme and preview syntax color overrides
    editorInstance.reconfigureTheme(currentConfig)
    applySyntaxColorsCSS(currentConfig.theme)
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
      case 'f': case 'F':
        if (!e.shiftKey) { e.preventDefault(); editorInstance.openSearch() }
        break
    }
  }
  if (e.key === 'Escape') {
    const tableDialog = document.getElementById('table-dialog')
    if (tableDialog) { tableDialog.remove(); return }
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
