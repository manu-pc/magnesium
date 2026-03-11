import type { MarkdownStyles, ElementStyle } from '../../shared/types'
import { DEFAULT_STYLES } from '../../shared/types'

export interface Preset {
  id: string
  name: string
  filename: string
  impliedTheme: 'light' | 'dark'
  styles: MarkdownStyles
}

const SYS_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const SYS_MONO = "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace"
const GEO_SERIF = "Georgia, serif"
const SEGOE = "'Segoe UI', system-ui, sans-serif"
const FIRA_CODE = "'Fira Code', monospace"
const SOURCE_SANS = "'Source Sans Pro', sans-serif"
const SOURCE_CODE = "'Source Code Pro', monospace"
const COURIER = "'Courier New', Courier, monospace"
const CONSOLAS = "Consolas, 'Courier New', monospace"

const base = (overrides: Partial<ElementStyle>): ElementStyle => ({
  fontFamily: SYS_SANS,
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#1f2328',
  lineHeight: 1.6,
  marginBottom: 16,
  ...overrides
})

// ---- GITHUB ----
const githubStyles: MarkdownStyles = {
  h1: base({ fontFamily: SYS_SANS, fontSize: 32, fontWeight: 'bold', color: '#1f2328', lineHeight: 1.25, marginBottom: 16, borderBottom: '1px solid #d1d9e0' }),
  h2: base({ fontFamily: SYS_SANS, fontSize: 24, fontWeight: 'bold', color: '#1f2328', lineHeight: 1.25, marginBottom: 16, borderBottom: '1px solid #d1d9e0' }),
  h3: base({ fontFamily: SYS_SANS, fontSize: 20, fontWeight: 'bold', color: '#1f2328', lineHeight: 1.25, marginBottom: 16 }),
  h4: base({ fontFamily: SYS_SANS, fontSize: 16, fontWeight: 'bold', color: '#1f2328', lineHeight: 1.25, marginBottom: 16 }),
  paragraph: base({ fontFamily: SYS_SANS, color: '#1f2328', lineHeight: 1.6 }),
  bold: base({ fontFamily: SYS_SANS, fontWeight: 'bold', color: '#1f2328', marginBottom: 0 }),
  italic: base({ fontFamily: SYS_SANS, fontStyle: 'italic', color: '#1f2328', marginBottom: 0 }),
  inlineCode: { fontFamily: CONSOLAS, fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.5, marginBottom: 0, backgroundColor: '#f6f8fa' },
  codeBlock: { fontFamily: CONSOLAS, fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', color: '#1f2328', lineHeight: 1.45, marginBottom: 16, backgroundColor: '#f6f8fa' },
  blockquote: base({ color: '#57606a', lineHeight: 1.6, marginBottom: 16 }),
  unorderedList: base({ lineHeight: 1.6, marginBottom: 4, listStyleType: 'disc', listIndent: 24 }),
  orderedList: base({ lineHeight: 1.6, marginBottom: 4, listStyleType: 'decimal', listIndent: 24 }),
  link: base({ color: '#0969da', marginBottom: 0 })
}

// ---- LATEX / ACADEMIC ----
const latexStyles: MarkdownStyles = {
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

// ---- NOTION ----
const notionStyles: MarkdownStyles = {
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

// ---- DRACULA (DARK) ----
const draculaStyles: MarkdownStyles = {
  h1: { fontFamily: SEGOE, fontSize: 32, fontWeight: 'bold', fontStyle: 'normal', color: '#bd93f9', lineHeight: 1.3, marginBottom: 20 },
  h2: { fontFamily: SEGOE, fontSize: 26, fontWeight: 'bold', fontStyle: 'normal', color: '#ff79c6', lineHeight: 1.35, marginBottom: 16 },
  h3: { fontFamily: SEGOE, fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', color: '#8be9fd', lineHeight: 1.4, marginBottom: 14 },
  h4: { fontFamily: SEGOE, fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', color: '#f1fa8c', lineHeight: 1.4, marginBottom: 12 },
  paragraph: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 16 },
  bold: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 0 },
  italic: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 0 },
  inlineCode: { fontFamily: FIRA_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#50fa7b', lineHeight: 1.5, marginBottom: 0, backgroundColor: '#44475a' },
  codeBlock: { fontFamily: FIRA_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.6, marginBottom: 16, backgroundColor: '#44475a' },
  blockquote: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#6272a4', lineHeight: 1.7, marginBottom: 16 },
  unorderedList: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 8, listStyleType: 'disc', listIndent: 24 },
  orderedList: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#f8f8f2', lineHeight: 1.7, marginBottom: 8, listStyleType: 'decimal', listIndent: 24 },
  link: { fontFamily: SEGOE, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#8be9fd', lineHeight: 1.7, marginBottom: 0 }
}

// ---- SOLARIZED LIGHT ----
const solarizedStyles: MarkdownStyles = {
  h1: { fontFamily: GEO_SERIF, fontSize: 32, fontWeight: 'bold', fontStyle: 'normal', color: '#268bd2', lineHeight: 1.3, marginBottom: 20 },
  h2: { fontFamily: GEO_SERIF, fontSize: 26, fontWeight: 'bold', fontStyle: 'normal', color: '#2aa198', lineHeight: 1.35, marginBottom: 16 },
  h3: { fontFamily: GEO_SERIF, fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', color: '#859900', lineHeight: 1.4, marginBottom: 14 },
  h4: { fontFamily: GEO_SERIF, fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', color: '#b58900', lineHeight: 1.4, marginBottom: 12 },
  paragraph: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#657b83', lineHeight: 1.7, marginBottom: 16 },
  bold: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', color: '#586e75', lineHeight: 1.7, marginBottom: 0 },
  italic: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#657b83', lineHeight: 1.7, marginBottom: 0 },
  inlineCode: { fontFamily: SOURCE_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#cb4b16', lineHeight: 1.5, marginBottom: 0, backgroundColor: '#eee8d5' },
  codeBlock: { fontFamily: SOURCE_CODE, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#657b83', lineHeight: 1.6, marginBottom: 16, backgroundColor: '#eee8d5' },
  blockquote: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'italic', color: '#839496', lineHeight: 1.7, marginBottom: 16 },
  unorderedList: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#657b83', lineHeight: 1.7, marginBottom: 8, listStyleType: 'disc', listIndent: 24 },
  orderedList: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#657b83', lineHeight: 1.7, marginBottom: 8, listStyleType: 'decimal', listIndent: 24 },
  link: { fontFamily: SOURCE_SANS, fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#268bd2', lineHeight: 1.7, marginBottom: 0 }
}

export const PRESETS: Preset[] = [
  { id: 'default', name: 'Default', filename: 'default.json', impliedTheme: 'light', styles: DEFAULT_STYLES },
  { id: 'github', name: 'GitHub', filename: 'github.json', impliedTheme: 'light', styles: githubStyles },
  { id: 'latex', name: 'LaTeX', filename: 'latex.json', impliedTheme: 'light', styles: latexStyles },
  { id: 'notion', name: 'Notion', filename: 'notion.json', impliedTheme: 'light', styles: notionStyles },
  { id: 'dracula', name: 'Dracula', filename: 'dracula.json', impliedTheme: 'dark', styles: draculaStyles },
  { id: 'solarized', name: 'Solarized Light', filename: 'solarized.json', impliedTheme: 'light', styles: solarizedStyles }
]

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}

// Suppress unused import warning (DEFAULT_STYLES re-exported via PRESETS)
void DEFAULT_STYLES
