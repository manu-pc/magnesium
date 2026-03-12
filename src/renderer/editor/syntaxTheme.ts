import { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { oneDark } from '@codemirror/theme-one-dark'
import type { AppConfig, SyntaxColors } from '../../shared/types'

export function createEditorTheme(config: AppConfig): Extension[] {
  const isDark = config.theme === 'dark'

  if (isDark) {
    const darkSelectionFix = EditorView.theme({
      '&.cm-focused > .cm-scroller > .cm-content .cm-selectionBackground': {
        backgroundColor: '#264f78 !important'
      },
      '.cm-selectionBackground': {
        backgroundColor: '#1e3a5f !important'
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(255,255,255,0.04)'
      },
      '.cm-content ::selection': {
        backgroundColor: '#264f78 !important'
      }
    }, { dark: true })
    return [oneDark, darkSelectionFix]
  }

  const sc = config.syntaxColors ?? DEFAULT_SYNTAX_COLORS

  const lightTheme = EditorView.theme(
    {
      '&': {
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        height: '100%'
      },
      '.cm-content': {
        fontFamily: `"Fira Code", "JetBrains Mono", monospace`,
        fontSize: `${config.editorFontSize}px`,
        lineHeight: '1.6',
        padding: '16px'
      },
      '.cm-scroller': {
        overflow: 'auto'
      },
      '.cm-gutters': {
        backgroundColor: '#f5f5f5',
        color: '#999',
        borderRight: '1px solid #e0e0e0'
      },
      '.cm-cursor': {
        borderLeftColor: '#2563eb'
      },
      '&.cm-focused > .cm-scroller > .cm-content .cm-selectionBackground': {
        backgroundColor: '#3390ff !important'
      },
      '.cm-selectionBackground': {
        backgroundColor: '#add6ff !important'
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(100, 149, 237, 0.08)'
      },
      '.cm-content ::selection': {
        backgroundColor: '#3390ff !important'
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#dde8fb'
      }
    },
    { dark: false }
  )

  const lightHighlightStyle = HighlightStyle.define([
    // Markdown
    { tag: tags.heading1, color: '#1a1a1a', fontWeight: 'bold', fontSize: '1.5em' },
    { tag: tags.heading2, color: '#1a1a1a', fontWeight: 'bold', fontSize: '1.3em' },
    { tag: tags.heading3, color: '#1a1a1a', fontWeight: 'bold', fontSize: '1.15em' },
    { tag: tags.emphasis, color: '#6b7280', fontStyle: 'italic' },
    { tag: tags.strong, color: '#1a1a1a', fontWeight: 'bold' },
    { tag: tags.monospace, color: '#c7254e', fontFamily: 'monospace' },
    { tag: tags.link, color: '#2563eb' },
    { tag: tags.url, color: '#2563eb', textDecoration: 'underline' },
    // Code syntax
    { tag: tags.comment, color: sc.comment },
    { tag: tags.lineComment, color: sc.comment },
    { tag: tags.blockComment, color: sc.comment },
    { tag: tags.docComment, color: sc.comment },
    { tag: tags.string, color: sc.string },
    { tag: tags.special(tags.string), color: sc.string },
    { tag: tags.keyword, color: sc.keyword },
    { tag: tags.controlKeyword, color: sc.keyword },
    { tag: tags.operatorKeyword, color: sc.keyword },
    { tag: tags.definitionKeyword, color: sc.keyword },
    { tag: tags.moduleKeyword, color: sc.keyword },
    { tag: tags.number, color: sc.number },
    { tag: tags.bool, color: sc.keyword },
    { tag: tags.null, color: sc.keyword },
    { tag: tags.variableName, color: sc.variable },
    { tag: tags.definition(tags.variableName), color: sc.variable },
    { tag: tags.function(tags.variableName), color: sc.function },
    { tag: tags.function(tags.propertyName), color: sc.function },
    { tag: tags.definition(tags.function(tags.variableName)), color: sc.function },
    { tag: tags.typeName, color: sc.type },
    { tag: tags.className, color: sc.type },
    { tag: tags.typeOperator, color: sc.type },
    { tag: tags.operator, color: sc.operator },
    { tag: tags.punctuation, color: sc.punctuation },
    { tag: tags.propertyName, color: sc.property },
    { tag: tags.attributeName, color: sc.property },
    { tag: tags.attributeValue, color: sc.string },
    { tag: tags.tagName, color: sc.keyword },
    { tag: tags.angleBracket, color: sc.punctuation },
  ])

  return [lightTheme, syntaxHighlighting(lightHighlightStyle)]
}

export const DEFAULT_SYNTAX_COLORS: SyntaxColors = {
  comment: '#9ca3af',
  string: '#22863a',
  keyword: '#d73a49',
  number: '#005cc5',
  variable: '#e36209',
  function: '#6f42c1',
  type: '#005cc5',
  operator: '#d73a49',
  punctuation: '#24292e',
  property: '#005cc5',
}
