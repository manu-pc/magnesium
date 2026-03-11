import { EditorView, basicSetup } from 'codemirror'
import { keymap } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { Compartment } from '@codemirror/state'
import { drawSelection } from '@codemirror/view'
import { indentMore, indentLess } from '@codemirror/commands'
import { createEditorTheme } from './syntaxTheme'
import type { AppConfig } from '../../shared/types'

interface EditorInstance {
  view: EditorView
  reconfigureTheme: (config: AppConfig) => void
  setContent: (content: string) => void
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

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        onChange(update.state.doc.toString())
      }, 150)
    }
  })

  const view = new EditorView({
    extensions: [
      listIndentKeymap,   // must be before basicSetup to take priority
      basicSetup,
      markdown(),
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

  return {
    view,
    reconfigureTheme: (newConfig: AppConfig) => {
      view.dispatch({
        effects: themeCompartment.reconfigure(createEditorTheme(newConfig))
      })
    },
    setContent: (content: string) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content }
      })
    }
  }
}
