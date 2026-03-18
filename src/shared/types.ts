export interface ElementStyle {
  fontFamily: string
  fontSize: number
  fontWeight: string
  fontStyle: string
  color: string
  lineHeight: number
  marginBottom: number
  // Optional extended fields for presets
  borderBottom?: string
  backgroundColor?: string
  textTransform?: string
  textAlign?: string
  // List-specific fields
  listStyleType?: string
  listStyleColor?: string
  listIndent?: number
}

export interface MarkdownStyles {
  h1: ElementStyle
  h2: ElementStyle
  h3: ElementStyle
  h4: ElementStyle
  paragraph: ElementStyle
  bold: ElementStyle
  italic: ElementStyle
  inlineCode: ElementStyle
  codeBlock: ElementStyle
  blockquote: ElementStyle
  unorderedList: ElementStyle
  orderedList: ElementStyle
  link: ElementStyle
  table: TableStyle
}

export interface TableCellStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  color: string
  backgroundColor: string
  textAlign: 'left' | 'center' | 'right'
  padding: number
}

export interface TableStyle {
  width: 'auto' | '100%'
  borderCollapse: 'collapse' | 'separate'
  borderRadius: number
  outerBorder: string
  header: TableCellStyle
  headerBackground: string
  cell: TableCellStyle
  stripedRows: boolean
  stripeColor: string
  cellBorder: string
  headerBorder: string
  hoverHighlight: boolean
  hoverColor: string
}

export interface CustomFormatRule {
  id: string
  name: string
  triggerType: 'line-prefix' | 'inline-regex' | 'list-marker' | 'char-replace'
  trigger: string
  markerSymbol?: string
  replacement?: string
  scope?: 'all' | 'inline-only' | 'outside-code'
  style: ElementStyle
  enabled: boolean
}

export interface PdfExportConfig {
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal'
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
  printBackground: boolean
}

export interface SyntaxColors {
  comment: string
  string: string
  keyword: string
  number: string
  variable: string
  function: string
  type: string
  operator: string
  punctuation: string
  property: string
}

export interface AppConfig {
  theme: 'light' | 'dark'
  language: 'en' | 'gl'
  editorFontSize: number
  previewWidth: number
  markdownStyles: MarkdownStyles
  recentFiles: string[]
  lastOpenedFile: string | null
  customRules: CustomFormatRule[]
  activePreset: string
  pdfExport: PdfExportConfig
  syntaxColors?: SyntaxColors
}

export interface FileState {
  currentPath: string | null
  isDirty: boolean
}

export interface StyleManifest {
  version: number
  name: string
  filename: string
  builtIn: boolean
  impliedTheme?: 'light' | 'dark'
  markdownStyles: MarkdownStyles
  customRules: CustomFormatRule[]
}

export const IPC = {
  FILE_OPEN: 'file:open',
  FILE_SAVE: 'file:save',
  FILE_SAVE_AS: 'file:save-as',
  FILE_LOADED: 'file:loaded',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_CHANGED: 'config:changed',
  EXPORT_PDF: 'export:pdf',
  SHOW_OPEN_DIALOG: 'dialog:open',
  SHOW_SAVE_DIALOG: 'dialog:save',
  WINDOW_BEFORE_CLOSE: 'window:before-close',
  WINDOW_CLOSE_CONFIRMED: 'window:close-confirmed',
  WINDOW_CLOSE_CANCELLED: 'window:close-cancelled',
  STYLE_EXPORT: 'style:export',
  STYLE_IMPORT: 'style:import',
  STYLES_LIST: 'styles:list',
  STYLES_SAVE_NEW: 'styles:save-new',
  STYLES_DELETE: 'styles:delete',
  STYLES_RENAME: 'styles:rename',
  STYLES_UPDATE: 'styles:update',
  SHELL_OPEN_EXTERNAL: 'shell:open-external',
  MENU_REBUILD: 'menu:rebuild',
  SHOW_CLOSE_DIALOG: 'dialog:close-confirm',
  SHOW_DISCARD_DIALOG: 'dialog:discard-confirm',
  IMAGE_PICK: 'image:pick',
} as const

export const DEFAULT_PDF_EXPORT: PdfExportConfig = {
  pageSize: 'A4',
  margins: { top: 0.4, bottom: 0.4, left: 0.6, right: 0.6 },
  printBackground: true
}

const SYS_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const SYS_MONO = "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace"
const GEO_SERIF = "Georgia, serif"

export const DEFAULT_TABLE_STYLE: TableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  borderRadius: 4,
  outerBorder: '1px solid #d1d9e0',
  header: {
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'normal',
    color: '#1f2328',
    backgroundColor: '#f6f8fa',
    textAlign: 'left',
    padding: 8,
  },
  headerBackground: '#f6f8fa',
  cell: {
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#1f2328',
    backgroundColor: '#ffffff',
    textAlign: 'left',
    padding: 8,
  },
  stripedRows: true,
  stripeColor: '#f6f8fa',
  cellBorder: '1px solid #d1d9e0',
  headerBorder: '2px solid #d1d9e0',
  hoverHighlight: true,
  hoverColor: '#eaf0f7',
}

const defaultElementStyle: ElementStyle = {
  fontFamily: SYS_SANS,
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#2d2d2d',
  lineHeight: 1.7,
  marginBottom: 16
}

export const DEFAULT_STYLES: MarkdownStyles = {
  h1: { fontFamily: GEO_SERIF, fontSize: 32, fontWeight: 'bold', fontStyle: 'normal', color: '#1a1a1a', lineHeight: 1.3, marginBottom: 24 },
  h2: { fontFamily: GEO_SERIF, fontSize: 26, fontWeight: 'bold', fontStyle: 'normal', color: '#1a1a1a', lineHeight: 1.35, marginBottom: 20 },
  h3: { fontFamily: GEO_SERIF, fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', color: '#1a1a1a', lineHeight: 1.4, marginBottom: 16 },
  h4: { fontFamily: GEO_SERIF, fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', color: '#1a1a1a', lineHeight: 1.4, marginBottom: 14 },
  paragraph: { ...defaultElementStyle },
  bold: { ...defaultElementStyle, fontWeight: 'bold', marginBottom: 0 },
  italic: { ...defaultElementStyle, fontStyle: 'italic', marginBottom: 0 },
  inlineCode: { fontFamily: SYS_MONO, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#c7254e', lineHeight: 1.5, marginBottom: 0, backgroundColor: '#f3f3f3' },
  codeBlock: { fontFamily: SYS_MONO, fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#383a42', lineHeight: 1.6, marginBottom: 16, backgroundColor: '#f6f8fa' },
  blockquote: { ...defaultElementStyle, color: '#6b7280', fontStyle: 'italic', marginBottom: 16, backgroundColor: '#f9f9f9' },
  unorderedList: { ...defaultElementStyle, marginBottom: 8, listStyleType: 'disc', listIndent: 24 },
  orderedList: { ...defaultElementStyle, marginBottom: 8, listStyleType: 'decimal', listIndent: 24 },
  link: { ...defaultElementStyle, color: '#2563eb', marginBottom: 0 },
  table: DEFAULT_TABLE_STYLE
}

export const DEFAULT_CONFIG: AppConfig = {
  theme: 'light',
  language: 'en',
  editorFontSize: 14,
  previewWidth: 50,
  markdownStyles: DEFAULT_STYLES,
  recentFiles: [],
  lastOpenedFile: null,
  customRules: [],
  activePreset: 'magnesium.json',
  pdfExport: DEFAULT_PDF_EXPORT
}

export interface WindowAPI {
  openFile: (filePath: string) => Promise<{ content: string; filePath: string }>
  saveFile: (filePath: string, content: string) => Promise<void>
  saveFileAs: (content: string) => Promise<{ filePath: string } | null>
  exportPdf: (htmlContent: string, pdfConfig: PdfExportConfig) => Promise<{ filePath: string } | { error: string }>
  getConfig: () => Promise<AppConfig>
  setConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>
  showOpenDialog: () => Promise<{ filePath: string } | null>
  showSaveDialog: () => Promise<{ filePath: string } | null>
  exportStyle: (markdownStyles: MarkdownStyles, customRules: CustomFormatRule[], name: string) => Promise<{ success: boolean; path?: string; error?: string }>
  importStyle: () => Promise<{ success: boolean; markdownStyles?: MarkdownStyles; customRules?: CustomFormatRule[]; name?: string; error?: string }>
  stylesList: () => Promise<StyleManifest[]>
  stylesSaveNew: (style: { name: string; markdownStyles: MarkdownStyles; customRules: CustomFormatRule[] }) => Promise<{ filename: string }>
  stylesDelete: (filename: string) => Promise<{ success: boolean }>
  stylesRename: (filename: string, newName: string) => Promise<{ success: boolean }>
  stylesUpdate: (filename: string, markdownStyles: MarkdownStyles, customRules: CustomFormatRule[]) => Promise<{ success: boolean }>
  openExternal: (url: string) => Promise<void>
  menuRebuild: (lang: string) => Promise<void>
  showCloseDialog: () => Promise<'save' | 'discard' | 'cancel'>
  showDiscardDialog: () => Promise<boolean>
  onFileLoaded: (callback: (data: { content: string; filePath: string }) => void) => void
  offFileLoaded: (callback: (data: { content: string; filePath: string }) => void) => void
  onWindowBeforeClose: (callback: () => void) => void
  offWindowBeforeClose: (callback: () => void) => void
  onConfigChanged: (callback: (config: AppConfig) => void) => void
  offConfigChanged: (callback: (config: AppConfig) => void) => void
  confirmClose: () => void
  cancelClose: () => void
  pickImage: () => Promise<{ dataUri: string; name: string } | null>
}
