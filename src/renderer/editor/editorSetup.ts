import { EditorView, basicSetup } from 'codemirror'
import { keymap } from '@codemirror/view'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { GFM } from '@lezer/markdown'
import { Compartment } from '@codemirror/state'
import { drawSelection } from '@codemirror/view'
import { indentMore, indentLess } from '@codemirror/commands'
import { openSearchPanel } from '@codemirror/search'
import { createEditorTheme } from './syntaxTheme'
import type { AppConfig } from '../../shared/types'

export type FileLanguage = 'markdown' | 'javascript' | 'typescript' | 'html' | 'css' | 'python' | 'java' | 'cpp'

export function detectLanguage(filePath: string | null): FileLanguage {
  if (!filePath) return 'markdown'
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'js': case 'mjs': case 'cjs': return 'javascript'
    case 'ts': case 'tsx': return 'typescript'
    case 'jsx': return 'javascript'
    case 'html': case 'htm': return 'html'
    case 'css': case 'scss': case 'less': return 'css'
    case 'py': return 'python'
    case 'java': return 'java'
    case 'c': case 'h': case 'cpp': case 'cc': case 'cxx': case 'hpp': return 'cpp'
    default: return 'markdown'
  }
}

function getLanguageExtension(lang: FileLanguage) {
  switch (lang) {
    case 'javascript': return javascript()
    case 'typescript': return javascript({ typescript: true })
    case 'html': return html()
    case 'css': return css()
    case 'python': return python()
    case 'java': return java()
    case 'cpp': return cpp()
    default: return markdown({ base: markdownLanguage, extensions: [GFM] })
  }
}

export interface EditorInstance {
  view: EditorView
  reconfigureTheme: (config: AppConfig) => void
  setContent: (content: string, silent?: boolean) => void
  setLanguage: (lang: FileLanguage) => void
  openSearch: () => void
}

const LIST_ITEM_RE = /^\s*([-*+>]|\d+[.)]) /

const listIndentKeymap = keymap.of([
  {
    key: 'Tab',
    run: (view) => {
      const line = view.state.doc.lineAt(view.state.selection.main.head)
      if (LIST_ITEM_RE.test(line.text)) return indentMore(view)
      return false
    }
  },
  {
    key: 'Shift-Tab',
    run: (view) => {
      const line = view.state.doc.lineAt(view.state.selection.main.head)
      if (LIST_ITEM_RE.test(line.text)) return indentLess(view)
      return false
    }
  }
])

export function initEditor(
  config: AppConfig,
  container: HTMLElement,
  onChange: (content: string) => void
): EditorInstance {
  const themeCompartment = new Compartment()
  const languageCompartment = new Compartment()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let silent = false

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && !silent) {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        onChange(update.state.doc.toString())
      }, 150)
    }
  })

  const view = new EditorView({
    extensions: [
      listIndentKeymap,
      basicSetup,
      languageCompartment.of(getLanguageExtension('markdown')),
      EditorView.lineWrapping,
      drawSelection(),
      themeCompartment.of(createEditorTheme(config)),
      updateListener
    ],
    parent: container
  })

  container.style.display = 'flex'
  container.style.flexDirection = 'column'
  container.style.height = '100%'

  container.addEventListener('wheel', (e) => {
    view.scrollDOM.scrollTop += e.deltaY
    e.preventDefault()
  }, { passive: false })

  return {
    view,
    reconfigureTheme: (newConfig: AppConfig) => {
      view.dispatch({
        effects: themeCompartment.reconfigure(createEditorTheme(newConfig))
      })
    },
    setContent: (content: string, suppressDirty = false) => {
      if (suppressDirty) {
        silent = true
        if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
      }
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content }
      })
      if (suppressDirty) {
        // Reset after microtask so the dispatch event is already consumed
        Promise.resolve().then(() => { silent = false })
      }
    },
    setLanguage: (lang: FileLanguage) => {
      view.dispatch({
        effects: languageCompartment.reconfigure(getLanguageExtension(lang))
      })
    },
    openSearch: () => {
      view.focus()
      openSearchPanel(view)
    }
  }
}
