import type { AppConfig, MarkdownStyles, ElementStyle, CustomFormatRule, PdfExportConfig, StyleManifest } from '../../shared/types'
import { DEFAULT_STYLES, DEFAULT_PDF_EXPORT } from '../../shared/types'
import { t, setLanguage, getLanguage } from '../../shared/i18n'

type StyleKey = keyof MarkdownStyles
type OnStylesChange = (styles: MarkdownStyles, customRules?: CustomFormatRule[]) => void

// ---- Font options ----

interface FontOption { label: string; value: string; category: string }

const FONT_OPTIONS: FontOption[] = [
  { label: 'System UI (sans-serif)', value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", category: 'system' },
  { label: 'System UI (serif)',      value: "ui-serif, Georgia, 'Times New Roman', serif",                          category: 'system' },
  { label: 'System Monospace',       value: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace",          category: 'system' },
  { label: 'Georgia',         value: 'Georgia, serif',                                  category: 'serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif",                 category: 'serif' },
  { label: 'Palatino',        value: "'Palatino Linotype', Palatino, serif",             category: 'serif' },
  { label: 'Garamond',        value: "Garamond, 'EB Garamond', serif",                  category: 'serif' },
  { label: 'Computer Modern', value: "'Computer Modern', 'Latin Modern Math', Georgia, serif", category: 'serif' },
  { label: 'Arial',           value: 'Arial, Helvetica, sans-serif',                    category: 'sans-serif' },
  { label: 'Helvetica',       value: 'Helvetica Neue, Helvetica, sans-serif',           category: 'sans-serif' },
  { label: 'Segoe UI',        value: "'Segoe UI', system-ui, sans-serif",               category: 'sans-serif' },
  { label: 'Verdana',         value: 'Verdana, Geneva, sans-serif',                     category: 'sans-serif' },
  { label: 'Trebuchet MS',    value: "'Trebuchet MS', sans-serif",                      category: 'sans-serif' },
  { label: 'Tahoma',          value: 'Tahoma, Geneva, sans-serif',                      category: 'sans-serif' },
  { label: 'Fira Sans',       value: "'Fira Sans', sans-serif",                         category: 'sans-serif' },
  { label: 'Source Sans Pro', value: "'Source Sans Pro', sans-serif",                   category: 'sans-serif' },
  { label: 'Courier New',     value: "'Courier New', Courier, monospace",               category: 'monospace' },
  { label: 'JetBrains Mono',  value: "'JetBrains Mono', monospace",                    category: 'monospace' },
  { label: 'Fira Code',       value: "'Fira Code', monospace",                         category: 'monospace' },
  { label: 'Source Code Pro', value: "'Source Code Pro', monospace",                   category: 'monospace' },
  { label: 'Cascadia Code',   value: "'Cascadia Code', monospace",                     category: 'monospace' },
  { label: 'Consolas',        value: "Consolas, 'Courier New', monospace",             category: 'monospace' },
]

function getElementLabels(): Record<StyleKey, string> {
  return {
    h1: t('element.h1'), h2: t('element.h2'), h3: t('element.h3'), h4: t('element.h4'),
    paragraph: t('element.paragraph'), bold: t('element.bold'), italic: t('element.italic'),
    inlineCode: t('element.inlineCode'), codeBlock: t('element.codeBlock'),
    blockquote: t('element.blockquote'), unorderedList: t('element.unorderedList'),
    orderedList: t('element.orderedList'), link: t('element.link')
  }
}

const INLINE_ELEMENTS: StyleKey[] = ['bold', 'italic', 'inlineCode', 'link']
const LIST_ELEMENTS: StyleKey[]   = ['unorderedList', 'orderedList']
const BG_ELEMENTS: StyleKey[]     = ['blockquote', 'codeBlock', 'inlineCode']

const EMOJI_SYMBOLS = ['→','←','↑','↓','✓','✗','✦','★','☆','◆','◇','●','○','■','□','•','‣','⁃','🔹','🔸','✅','❌','⚡','🔥','💡','📌','🎯','➤','⮞','▸']

const UNORDERED_MARKER_OPTIONS = [
  { value: '-', label: '- (hyphen)' }, { value: '*', label: '* (asterisk)' },
  { value: '+', label: '+ (plus)' },   { value: '>', label: '> (greater-than)' },
  { value: '~', label: '~ (tilde)' },  { value: ':', label: ': (colon)' },
  { value: '!', label: '! (exclamation)' }, { value: '?', label: '? (question)' },
  { value: '#', label: '# (hash)' },   { value: '@', label: '@ (at)' },
  { value: '$', label: '$ (dollar)' }, { value: '%', label: '% (percent)' },
  { value: '&', label: '& (ampersand)' }, { value: '=', label: '= (equals)' },
  { value: '^', label: '^ (caret)' },  { value: '|', label: '| (pipe)' },
  { value: '\\', label: '\\ (backslash)' },
]

const ORDERED_MARKER_OPTIONS = [
  { value: 'ordered:.', label: 'ordered: 1. 2. 3.' },
  { value: 'ordered:)', label: 'ordered: 1) 2) 3)' },
  { value: 'ordered:alpha.', label: 'ordered: a. b. c.' },
  { value: 'ordered:ALPHA.', label: 'ordered: A. B. C.' },
]

const CHAR_REPLACE_PRESETS = [
  { trigger: '[pi]', replacement: 'π' }, { trigger: '[alpha]', replacement: 'α' },
  { trigger: '[beta]', replacement: 'β' }, { trigger: '[gamma]', replacement: 'γ' },
  { trigger: '[delta]', replacement: 'δ' }, { trigger: '[inf]', replacement: '∞' },
  { trigger: '[deg]', replacement: '°' }, { trigger: '[pm]', replacement: '±' },
  { trigger: '[times]', replacement: '×' }, { trigger: '[div]', replacement: '÷' },
  { trigger: '(c)', replacement: '©' }, { trigger: '(r)', replacement: '®' },
  { trigger: '(tm)', replacement: '™' }, { trigger: '--', replacement: '–' },
  { trigger: '---', replacement: '—' }, { trigger: '!=', replacement: '≠' },
  { trigger: '<=', replacement: '≤' }, { trigger: '>=', replacement: '≥' },
  { trigger: '->', replacement: '→' }, { trigger: '<-', replacement: '←' },
  { trigger: '<->', replacement: '↔' },
]

// ---- State ----

let currentStyles: MarkdownStyles
let currentRules: CustomFormatRule[]
let currentPdfConfig: PdfExportConfig
let currentLanguage: 'en' | 'gl'
let activePresetFilename: string
let onChangeCallback: OnStylesChange
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null
let addingRule = false
let cachedManifests: StyleManifest[] | null = null

// ---- Init ----

export function initSettingsPanel(config: AppConfig, onStylesChange: OnStylesChange): void {
  currentStyles     = JSON.parse(JSON.stringify(config.markdownStyles))
  currentRules      = JSON.parse(JSON.stringify(config.customRules ?? []))
  currentPdfConfig  = JSON.parse(JSON.stringify(config.pdfExport ?? DEFAULT_PDF_EXPORT))
  currentLanguage   = config.language ?? 'en'
  activePresetFilename = config.activePreset ?? 'default.json'
  onChangeCallback  = onStylesChange

  const panel   = document.getElementById('settings-panel')!
  const overlay = document.getElementById('settings-overlay')!

  panel.innerHTML = buildPanelHTML()
  wireControls(panel)

  overlay.addEventListener('click', closePanel)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel()
  })
}

// ---- HTML builders ----

function buildPanelHTML(): string {
  const ELEMENT_LABELS = getElementLabels()
  const elements = Object.keys(ELEMENT_LABELS) as StyleKey[]
  const sectionsHTML = elements.map(buildElementSection).join('\n')

  return `
    <div class="settings-header">
      <span>${t('settings.title')}</span>
      <div style="display:flex;gap:4px;align-items:center;">
        <button class="reset-btn" id="btn-export-style" style="font-size:11px;">${t('settings.export')}</button>
        <button class="reset-btn" id="btn-import-style" style="font-size:11px;">${t('settings.import')}</button>
        <button class="settings-close-btn" id="settings-close">&#x2715;</button>
      </div>
    </div>
    <div class="settings-body">
      <div class="settings-section" id="language-section">
        <div class="settings-element-header" data-element-toggle="__language__">
          <span class="settings-element-title">${t('settings.language')}</span>
          <span class="settings-element-toggle" data-toggle-icon="__language__">&#x25BC;</span>
        </div>
        <div class="settings-controls" id="controls-__language__">
          <div class="control-row" style="gap:16px;padding:4px 0;">
            <label style="font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;">
              <input type="radio" name="lang-select" value="en" ${currentLanguage === 'en' ? 'checked' : ''} /> English
            </label>
            <label style="font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;">
              <input type="radio" name="lang-select" value="gl" ${currentLanguage === 'gl' ? 'checked' : ''} /> Galego
            </label>
          </div>
        </div>
      </div>
      <div class="settings-section" id="presets-section">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0 8px;">
          <span class="settings-element-title" style="font-weight:600;">${t('settings.presets')}</span>
          <div style="display:flex;gap:4px;">
            <button class="reset-btn" id="btn-save-to-preset" style="font-size:11px;${activePresetFilename === 'custom' ? 'display:none;' : ''}">${t('settings.saveToPreset')}</button>
            <button class="reset-btn" id="btn-new-style" style="font-size:11px;">${t('settings.newStyle')}</button>
          </div>
        </div>
        <div id="new-style-form" style="display:none;"></div>
        <div id="presets-grid" style="display:flex;flex-wrap:wrap;gap:8px;padding-bottom:8px;">
          <div style="color:var(--text-secondary);font-size:12px;">${t('preset.loading')}</div>
        </div>
      </div>
      <div class="settings-section" id="pdf-export-section">
        <div class="settings-element-header" data-element-toggle="__pdf_export__">
          <span class="settings-element-title">${t('settings.pdfExport')}</span>
          <span class="settings-element-toggle" data-toggle-icon="__pdf_export__">&#x25BC;</span>
        </div>
        <div class="settings-controls" id="controls-__pdf_export__">
          ${buildPdfSettingsHTML()}
        </div>
      </div>
      ${sectionsHTML}
      <div class="settings-section" id="custom-rules-section">
        <div class="settings-element-header" data-element-toggle="__custom_rules__">
          <span class="settings-element-title">${t('settings.customRules')}</span>
          <span class="settings-element-toggle" data-toggle-icon="__custom_rules__">&#x25BC;</span>
        </div>
        <div class="settings-controls" id="controls-__custom_rules__">
          <div id="custom-rules-list"></div>
          <button class="reset-btn" id="btn-add-rule" style="margin-top:8px;">${t('rules.add')}</button>
          <div id="add-rule-form" style="display:none;"></div>
        </div>
      </div>
    </div>
    <div class="settings-footer">
      <button class="reset-all-btn" id="reset-all-styles">${t('settings.resetAll')}</button>
    </div>
  `
}

function buildPdfSettingsHTML(): string {
  const c = currentPdfConfig
  return `
    <div class="control-row">
      <span class="control-label">${t('settings.pdf.pageSize')}</span>
      <select id="pdf-page-size">
        ${(['A4','A3','Letter','Legal'] as const).map(s => `<option value="${s}" ${c.pageSize===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="control-row" style="align-items:flex-start;">
      <span class="control-label">${t('settings.pdf.margins')}</span>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;flex:1;">
        ${(['top','bottom','left','right'] as const).map(side => `
        <div style="display:flex;align-items:center;gap:4px;font-size:11px;">
          <span style="width:46px;color:var(--text-secondary);">${t('settings.pdf.'+side)}</span>
          <input type="number" id="pdf-margin-${side}" value="${c.margins[side]}" step="0.1" min="0" max="3"
            style="width:56px;padding:3px 5px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:11px;" />
        </div>`).join('')}
      </div>
    </div>
    <div class="control-row">
      <span class="control-label">${t('settings.pdf.printBackground')}</span>
      <input type="checkbox" id="pdf-print-bg" ${c.printBackground?'checked':''} style="width:auto;" />
    </div>
    <div class="control-row">
      <span id="pdf-summary" style="font-size:11px;color:var(--text-secondary);">${pdfSummaryText(c)}</span>
    </div>
  `
}

function pdfSummaryText(c: PdfExportConfig): string {
  return `Page: ${c.pageSize} — Margins: ${c.margins.top.toFixed(1)}in / ${c.margins.left.toFixed(1)}in`
}

function buildElementSection(key: StyleKey): string {
  const ELEMENT_LABELS = getElementLabels()
  const label    = ELEMENT_LABELS[key]
  const isInline = INLINE_ELEMENTS.includes(key)
  const isList   = LIST_ELEMENTS.includes(key)
  const hasBg    = BG_ELEMENTS.includes(key)
  const style    = currentStyles[key]
  const bgVal    = style.backgroundColor ?? ''

  return `
    <div class="settings-section" data-element="${key}">
      <div class="settings-element-header" data-element-toggle="${key}">
        <span class="settings-element-title">${label}</span>
        <span class="settings-element-toggle" data-toggle-icon="${key}">&#x25BC;</span>
      </div>
      <div class="settings-controls" id="controls-${key}">
        <div class="settings-preview-snippet" id="preview-${key}"></div>
        <div class="control-row">
          <span class="control-label">${t('settings.font.family')}</span>
          <select data-prop="fontFamily" data-element="${key}">
            ${FONT_OPTIONS.map(f=>`<option value="${f.value}">${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="control-row">
          <span class="control-label">${t('settings.font.size')}</span>
          <div class="number-control">
            <button data-action="decrease" data-prop="fontSize" data-element="${key}">&#x2212;</button>
            <input type="number" data-prop="fontSize" data-element="${key}" min="8" max="72" style="width:50px;text-align:center;" />
            <button data-action="increase" data-prop="fontSize" data-element="${key}">+</button>
          </div>
        </div>
        <div class="control-row">
          <span class="control-label">${t('settings.font.weight')}</span>
          <button class="toggle-btn" data-prop="fontWeight" data-element="${key}" data-value="bold">${t('settings.font.weightBold')}</button>
        </div>
        <div class="control-row">
          <span class="control-label">${t('settings.font.style')}</span>
          <button class="toggle-btn" data-prop="fontStyle" data-element="${key}" data-value="italic">${t('settings.font.styleItalic')}</button>
        </div>
        <div class="control-row">
          <span class="control-label">${t('settings.font.color')}</span>
          <input type="color" data-prop="color" data-element="${key}" />
          <input type="text" data-prop="colorHex" data-element="${key}" style="width:80px;" />
        </div>
        <div class="control-row">
          <span class="control-label">${t('settings.font.lineHeight')}</span>
          <input type="range" data-prop="lineHeight" data-element="${key}" min="1.0" max="2.5" step="0.1" style="flex:1" />
          <span data-display="lineHeight" data-element="${key}" style="width:30px;font-size:11px;"></span>
        </div>
        ${!isInline ? `
        <div class="control-row">
          <span class="control-label">${t('settings.font.marginBottom')}</span>
          <div class="number-control">
            <button data-action="decrease" data-prop="marginBottom" data-element="${key}">&#x2212;</button>
            <input type="number" data-prop="marginBottom" data-element="${key}" min="0" max="100" style="width:50px;text-align:center;" />
            <button data-action="increase" data-prop="marginBottom" data-element="${key}">+</button>
          </div>
        </div>` : ''}
        ${hasBg ? `
        <div class="control-row">
          <span class="control-label">${t('settings.font.background')}</span>
          <input type="color" data-prop="backgroundColor" data-element="${key}" value="${bgVal||'#ffffff'}" />
          <input type="text" data-prop="backgroundColorHex" data-element="${key}" value="${bgVal}" style="width:80px;" placeholder="(none)" />
          <button class="reset-btn" data-prop="backgroundColorClear" data-element="${key}" style="padding:2px 6px;font-size:10px;">✕</button>
        </div>` : ''}
        ${isList ? buildListSpecificControls(key) : ''}
        <div class="control-row" style="justify-content:flex-end;">
          <button class="reset-btn" data-reset-element="${key}">${t('settings.font.reset')}</button>
        </div>
      </div>
    </div>
  `
}

function buildListSpecificControls(key: StyleKey): string {
  const isUl = key === 'unorderedList'
  const style = currentStyles[key]
  const currentListType  = style.listStyleType ?? (isUl ? 'disc' : 'decimal')
  const currentIndent    = style.listIndent ?? 24
  const currentMarkerColor = style.listStyleColor ?? ''

  const ulTypes = [
    { value: 'disc', label: 'Disc (●)' }, { value: 'circle', label: 'Circle (○)' },
    { value: 'square', label: 'Square (■)' }, { value: 'none', label: 'None' },
    { value: '__custom__', label: 'Custom...' }
  ]
  const olTypes = [
    { value: 'decimal', label: 'Decimal (1. 2. 3.)' }, { value: 'lower-alpha', label: 'Lower Alpha (a. b. c.)' },
    { value: 'upper-alpha', label: 'Upper Alpha (A. B. C.)' }, { value: 'lower-roman', label: 'Lower Roman (i. ii. iii.)' },
    { value: 'upper-roman', label: 'Upper Roman (I. II. III.)' }, { value: 'none', label: 'None' },
    { value: '__custom__', label: 'Custom...' }
  ]
  const types = isUl ? ulTypes : olTypes
  const knownValues = types.map(tp => tp.value).filter(v => v !== '__custom__')
  const isCustomType = !knownValues.includes(currentListType)

  return `
    <div class="control-row">
      <span class="control-label">${isUl ? t('settings.list.bulletStyle') : t('settings.list.numberStyle')}</span>
      <select data-prop="listStyleType" data-element="${key}" id="lst-type-${key}">
        ${types.map(tp => `<option value="${tp.value}" ${!isCustomType && currentListType===tp.value?'selected':''}>${tp.label}</option>`).join('')}
        ${isCustomType ? `<option value="${currentListType}" selected>Custom: ${currentListType}</option>` : ''}
      </select>
    </div>
    <div class="control-row" id="lst-custom-row-${key}" style="${isCustomType?'':'display:none;'}">
      <span class="control-label">${t('settings.list.customValue')}</span>
      <input type="text" id="lst-custom-${key}" data-prop="listStyleTypeCustom" data-element="${key}"
        placeholder="e.g. '→'" value="${isCustomType?currentListType:''}" style="flex:1;" />
    </div>
    <div class="control-row">
      <span class="control-label">${t('settings.list.markerColor')}</span>
      <input type="color" data-prop="listStyleColor" data-element="${key}" value="${currentMarkerColor||'#000000'}" />
      <input type="text" data-prop="listStyleColorHex" data-element="${key}" value="${currentMarkerColor}" style="width:80px;" placeholder="(inherit)" />
      <button class="reset-btn" data-prop="listStyleColorClear" data-element="${key}" style="padding:2px 6px;font-size:10px;">✕</button>
    </div>
    <div class="control-row">
      <span class="control-label">${t('settings.list.indent')}</span>
      <input type="number" data-prop="listIndent" data-element="${key}" min="8" max="80" value="${currentIndent}" style="width:60px;" />
    </div>
  `
}

function buildRuleFormHTML(rule?: Partial<CustomFormatRule>): string {
  const isEdit = !!rule?.id
  const fontOptsHTML = FONT_OPTIONS.map(f=>`<option value="${f.value}">${f.label}</option>`).join('')
  const defaultStyle: ElementStyle = {
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#e74c3c', lineHeight: 1.6, marginBottom: 0
  }
  const s = rule?.style ?? defaultStyle
  const triggerType = rule?.triggerType ?? 'line-prefix'
  const scope = (rule as CustomFormatRule | undefined)?.scope ?? 'outside-code'
  const isListMarker  = triggerType === 'list-marker'
  const isCharReplace = triggerType === 'char-replace'

  const markerOptsHTML = [
    `<optgroup label="Unordered markers">`,
    ...UNORDERED_MARKER_OPTIONS.map(o => `<option value="${o.value}" ${isListMarker && rule?.trigger===o.value?'selected':''}>${o.label}</option>`),
    `</optgroup><optgroup label="Ordered markers">`,
    ...ORDERED_MARKER_OPTIONS.map(o => `<option value="${o.value}" ${isListMarker && rule?.trigger===o.value?'selected':''}>${o.label}</option>`),
    `</optgroup>`
  ].join('')

  const presetsOptsHTML = `<option value="">— ${t('rules.replace.presets')} —</option>` +
    CHAR_REPLACE_PRESETS.map(p=>`<option value="${p.trigger}|${p.replacement}">${p.trigger} → ${p.replacement}</option>`).join('')

  return `
    <div class="rule-form" style="border:1px solid var(--border-color);border-radius:6px;padding:10px;margin-top:8px;">
      <div class="control-row" style="margin-bottom:6px;">
        <span class="control-label">${t('rules.name')}</span>
        <input type="text" id="rf-name" value="${rule?.name??''}" placeholder="My Rule"
          style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;" />
      </div>
      <div class="control-row" style="margin-bottom:6px;">
        <span class="control-label">${t('rules.type')}</span>
        <select id="rf-trigger-type" style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;">
          <option value="line-prefix"  ${triggerType==='line-prefix' ?'selected':''}>${t('rules.type.linePrefix')}</option>
          <option value="inline-regex" ${triggerType==='inline-regex'?'selected':''}>${t('rules.type.inlineRegex')}</option>
          <option value="list-marker"  ${triggerType==='list-marker' ?'selected':''}>${t('rules.type.listMarker')}</option>
          <option value="char-replace" ${triggerType==='char-replace'?'selected':''}>${t('rules.type.charReplace')}</option>
        </select>
      </div>
      <div id="rf-trigger-row" class="control-row" style="${isListMarker||isCharReplace?'display:none;':''}margin-bottom:6px;">
        <span class="control-label" id="rf-trigger-label">${t('rules.trigger')}</span>
        <input type="text" id="rf-trigger" value="${!isListMarker&&!isCharReplace?(rule?.trigger??''):''}"
          placeholder="^" style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;" />
        <span id="rf-regex-indicator" style="margin-left:4px;font-size:14px;"></span>
      </div>
      <div id="rf-marker-select-row" style="${isListMarker?'':'display:none;'}margin-bottom:6px;">
        <div class="control-row">
          <span class="control-label">${t('rules.marker.character')}</span>
          <select id="rf-marker-select" style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;">
            ${markerOptsHTML}
          </select>
        </div>
      </div>
      <div id="rf-marker-symbol-row" style="${isListMarker?'':'display:none;'}margin-bottom:6px;">
        <div class="control-row" style="margin-bottom:4px;">
          <span class="control-label">${t('rules.marker.displaySymbol')}</span>
          <input type="text" id="rf-marker-symbol" value="${(rule as CustomFormatRule|undefined)?.markerSymbol??''}"
            placeholder="→ ✓ ◆ ..." style="width:60px;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:14px;" />
          <button class="reset-btn" id="rf-emoji-btn" style="padding:2px 8px;font-size:11px;">&#x1F4CB;</button>
        </div>
        <div id="rf-emoji-picker" style="display:none;flex-wrap:wrap;gap:4px;padding:6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);margin-top:4px;">
          ${EMOJI_SYMBOLS.map(sym=>`<button class="rf-emoji-sym" style="padding:2px 4px;font-size:16px;border:1px solid var(--border-color);border-radius:3px;cursor:pointer;background:var(--bg-tertiary);" data-sym="${sym}">${sym}</button>`).join('')}
        </div>
        <div style="font-size:10px;color:var(--text-secondary);margin-top:2px;">${t('rules.marker.note')}</div>
      </div>
      <div id="rf-char-replace-rows" style="${isCharReplace?'':'display:none;'}">
        <div class="control-row" style="margin-bottom:6px;">
          <span class="control-label">${t('rules.replace.presets')}</span>
          <select id="rf-replace-preset" style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;">
            ${presetsOptsHTML}
          </select>
        </div>
        <div class="control-row" style="margin-bottom:6px;">
          <span class="control-label">${t('rules.replace.trigger')}</span>
          <input type="text" id="rf-char-trigger" value="${isCharReplace?(rule?.trigger??''):''}" placeholder="[pi]"
            style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;" />
        </div>
        <div class="control-row" style="margin-bottom:6px;">
          <span class="control-label">${t('rules.replace.replacement')}</span>
          <input type="text" id="rf-char-replacement" value="${(rule as CustomFormatRule|undefined)?.replacement??''}" placeholder="π"
            style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:14px;" />
        </div>
        <div class="control-row" style="margin-bottom:6px;">
          <span class="control-label">${t('rules.replace.scope')}</span>
          <select id="rf-char-scope" style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;">
            <option value="all"          ${scope==='all'          ?'selected':''}>${t('rules.replace.scope.all')}</option>
            <option value="outside-code" ${scope==='outside-code'?'selected':''}>${t('rules.replace.scope.outsideCode')}</option>
            <option value="inline-only"  ${scope==='inline-only' ?'selected':''}>${t('rules.replace.scope.inlineOnly')}</option>
          </select>
        </div>
      </div>
      <div class="control-row" style="margin-bottom:6px;">
        <span class="control-label">${t('rules.font')}</span>
        <select id="rf-font-family" style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;">${fontOptsHTML}</select>
      </div>
      <div class="control-row" style="margin-bottom:6px;">
        <span class="control-label">${t('rules.size')}</span>
        <input type="number" id="rf-font-size" value="${s.fontSize}" min="8" max="72"
          style="width:60px;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;" />
        <button class="toggle-btn ${s.fontWeight==='bold'?'active':''}" id="rf-bold">${t('settings.font.weightBold')}</button>
        <button class="toggle-btn ${s.fontStyle==='italic'?'active':''}" id="rf-italic">${t('settings.font.styleItalic')}</button>
      </div>
      <div class="control-row" style="margin-bottom:6px;">
        <span class="control-label">${t('rules.color')}</span>
        <input type="color" id="rf-color" value="${s.color}" />
        <input type="text" id="rf-color-hex" value="${s.color}"
          style="width:80px;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;" />
      </div>
      <div class="settings-preview-snippet" id="rf-preview" style="margin-bottom:8px;font-family:${s.fontFamily};font-size:${Math.min(s.fontSize,18)}px;font-weight:${s.fontWeight};font-style:${s.fontStyle};color:${s.color};">${t('rules.preview')}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="reset-btn" id="rf-cancel">${t('rules.cancel')}</button>
        <button class="toggle-btn active" id="rf-save">${isEdit?t('rules.update'):t('rules.save')}</button>
      </div>
    </div>
  `
}

// ---- Wiring ----

function wireControls(panel: HTMLElement): void {
  panel.querySelector('#settings-close')?.addEventListener('click', closePanel)

  // Language selector
  panel.querySelectorAll('input[name="lang-select"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const lang = (e.target as HTMLInputElement).value as 'en' | 'gl'
      currentLanguage = lang
      setLanguage(lang)
      window.electronAPI.setConfig('language', lang)
      await window.electronAPI.menuRebuild(lang)
      // Re-render panel with new language
      panel.innerHTML = buildPanelHTML()
      wireControls(panel)
      refreshAllControls(panel)
      renderCustomRulesList(panel)
      await reloadStylesList()
    })
  })

  panel.querySelector('#reset-all-styles')?.addEventListener('click', async () => {
    currentStyles = JSON.parse(JSON.stringify(DEFAULT_STYLES))
    activePresetFilename = 'default.json'
    refreshAllControls(panel)
    window.electronAPI.setConfig('activePreset', 'default.json')
    notifyChange()
    await reloadStylesList()
  })

  panel.querySelector('#btn-export-style')?.addEventListener('click', async () => {
    const result = await window.electronAPI.exportStyle(currentStyles, currentRules, activePresetFilename)
    if (result.success) showToast(t('toast.exportOk'))
    else if (result.error !== 'Cancelled') showToast(`${t('toast.exportFail')}: ${result.error}`)
  })

  panel.querySelector('#btn-import-style')?.addEventListener('click', async () => {
    const result = await window.electronAPI.importStyle()
    if (result.success && result.markdownStyles) {
      currentStyles = JSON.parse(JSON.stringify(result.markdownStyles))
      currentRules  = JSON.parse(JSON.stringify(result.customRules ?? []))
      activePresetFilename = 'custom'
      refreshAllControls(panel)
      renderCustomRulesList(panel)
      notifyChange()
      showToast(t('toast.importOk', { name: result.name ?? 'Imported' }))
      await reloadStylesList()
    } else if (result.error && result.error !== 'Cancelled') {
      showToast(`${t('toast.importFail')}: ${result.error}`)
    }
  })

  panel.querySelector('#btn-save-to-preset')?.addEventListener('click', async () => {
    if (activePresetFilename === 'custom') return
    const manifests = cachedManifests ?? await window.electronAPI.stylesList()
    const manifest = manifests.find(m => m.filename === activePresetFilename)
    const result = await window.electronAPI.stylesUpdate(
      activePresetFilename,
      JSON.parse(JSON.stringify(currentStyles)),
      JSON.parse(JSON.stringify(currentRules))
    )
    if (result.success) {
      showToast(t('toast.styleSaved', { name: manifest?.name ?? activePresetFilename }))
      await reloadStylesList()
    } else {
      showToast(t('toast.styleSaveFail'))
    }
  })

  panel.querySelector('#btn-new-style')?.addEventListener('click', () => {
    const formEl = document.getElementById('new-style-form')!
    if (formEl.style.display !== 'none') { formEl.style.display='none'; formEl.innerHTML=''; return }
    formEl.innerHTML = `
      <div style="border:1px solid var(--border-color);border-radius:6px;padding:10px;margin-bottom:8px;">
        <div class="control-row" style="margin-bottom:6px;">
          <span class="control-label">${t('preset.styleName')}</span>
          <input type="text" id="ns-name" placeholder="${t('newstyle.namePlaceholder')}"
            style="flex:1;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:12px;" />
        </div>
        <div class="control-row" style="margin-bottom:8px;gap:12px;">
          <span class="control-label">${t('preset.startWith')}</span>
          <label style="font-size:12px;cursor:pointer;"><input type="radio" name="ns-base" value="scratch" checked style="margin-right:4px;" />${t('preset.startBlank')}</label>
          <label style="font-size:12px;cursor:pointer;"><input type="radio" name="ns-base" value="current" style="margin-right:4px;" />${t('preset.copyCurrent')}</label>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="reset-btn" id="ns-cancel">${t('rules.cancel')}</button>
          <button class="toggle-btn active" id="ns-save">${t('preset.create')}</button>
        </div>
      </div>
    `
    formEl.style.display = 'block'
    formEl.querySelector('#ns-cancel')?.addEventListener('click', () => { formEl.style.display='none'; formEl.innerHTML='' })
    formEl.querySelector('#ns-save')?.addEventListener('click', async () => {
      const name = (formEl.querySelector<HTMLInputElement>('#ns-name')!.value || t('newstyle.namePlaceholder')).trim()
      const base = formEl.querySelector<HTMLInputElement>('input[name="ns-base"]:checked')?.value ?? 'scratch'
      const markdownStyles = base === 'current' ? JSON.parse(JSON.stringify(currentStyles)) : JSON.parse(JSON.stringify(DEFAULT_STYLES))
      const customRules    = base === 'current' ? JSON.parse(JSON.stringify(currentRules))  : []
      const result = await window.electronAPI.stylesSaveNew({ name, markdownStyles, customRules })
      formEl.style.display='none'; formEl.innerHTML=''
      showToast(t('toast.styleCreated', { name }))
      await reloadStylesList()
      await applyStyleFromFile(result.filename)
    })
  })

  wirePdfSettings(panel)

  panel.querySelectorAll('[data-element-toggle]').forEach(el => {
    el.addEventListener('click', () => {
      const key = (el as HTMLElement).dataset.elementToggle!
      const controls = document.getElementById(`controls-${key}`)
      const icon = panel.querySelector(`[data-toggle-icon="${key}"]`)
      if (controls) { controls.classList.toggle('open'); icon?.classList.toggle('open') }
    })
  })

  panel.querySelectorAll('[data-reset-element]').forEach(el => {
    el.addEventListener('click', () => {
      const key = (el as HTMLElement).dataset.resetElement as StyleKey
      if (!getElementLabels()[key]) return
      currentStyles[key] = JSON.parse(JSON.stringify(DEFAULT_STYLES[key]))
      refreshElementControls(panel, key)
      markCustomPreset(panel)
      notifyChange()
    })
  })

  const elements = Object.keys(getElementLabels()) as StyleKey[]
  elements.forEach(key => { refreshElementControls(panel, key); updatePreviewSnippet(key) })

  panel.addEventListener('change', e => handleControlChange(e, panel))
  panel.addEventListener('input',  e => handleControlChange(e, panel))
  panel.addEventListener('click',  e => handleButtonClick(e, panel))

  LIST_ELEMENTS.forEach(key => {
    const typeSelect = panel.querySelector<HTMLSelectElement>(`#lst-type-${key}`)
    if (typeSelect) typeSelect.addEventListener('change', () => {
      const customRow = document.getElementById(`lst-custom-row-${key}`)
      if (customRow) customRow.style.display = typeSelect.value==='__custom__' ? '' : 'none'
    })
  })

  renderCustomRulesList(panel)
  panel.querySelector('#btn-add-rule')?.addEventListener('click', () => {
    if (addingRule) return
    addingRule = true
    const formEl = document.getElementById('add-rule-form')!
    formEl.innerHTML = buildRuleFormHTML()
    formEl.style.display = 'block'
    wireRuleForm(formEl, panel, null)
    const rfFont = formEl.querySelector<HTMLSelectElement>('#rf-font-family')
    if (rfFont) rfFont.value = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  })
}

function wirePdfSettings(panel: HTMLElement): void {
  const updateSummary = () => {
    const el = panel.querySelector<HTMLElement>('#pdf-summary')
    if (el) el.textContent = pdfSummaryText(currentPdfConfig)
  }
  const save = () => { window.electronAPI.setConfig('pdfExport', JSON.parse(JSON.stringify(currentPdfConfig))); updateSummary() }

  panel.querySelector<HTMLSelectElement>('#pdf-page-size')?.addEventListener('change', e => {
    currentPdfConfig.pageSize = (e.target as HTMLSelectElement).value as PdfExportConfig['pageSize']; save()
  })
  ;(['top','bottom','left','right'] as const).forEach(side => {
    panel.querySelector<HTMLInputElement>(`#pdf-margin-${side}`)?.addEventListener('input', e => {
      const val = parseFloat((e.target as HTMLInputElement).value)
      if (!isNaN(val)) { currentPdfConfig.margins[side] = Math.max(0, Math.min(3, val)); save() }
    })
  })
  panel.querySelector<HTMLInputElement>('#pdf-print-bg')?.addEventListener('change', e => {
    currentPdfConfig.printBackground = (e.target as HTMLInputElement).checked; save()
  })
}

async function applyStyleFromFile(filename: string): Promise<void> {
  const styles = await window.electronAPI.stylesList()
  const found = styles.find(s => s.filename === filename)
  if (!found) return
  const panel = document.getElementById('settings-panel')!
  currentStyles = JSON.parse(JSON.stringify(found.markdownStyles))
  currentRules  = JSON.parse(JSON.stringify(found.customRules ?? []))
  markNamedPreset(filename)
  refreshAllControls(panel)
  renderCustomRulesList(panel)
  window.electronAPI.setConfig('activePreset', filename)
  notifyChange()
  reloadStylesList()
}

async function reloadStylesList(): Promise<void> {
  const gridEl = document.getElementById('presets-grid')
  if (!gridEl) return
  try {
    const manifests = await window.electronAPI.stylesList()
    cachedManifests = manifests
    renderPresetsGrid(gridEl, manifests)
  } catch (err) {
    gridEl.innerHTML = `<div style="color:red;font-size:12px;">${t('preset.loadError')}: ${err}</div>`
  }
}

function renderPresetsGrid(gridEl: HTMLElement, manifests: StyleManifest[]): void {
  gridEl.innerHTML = ''
  for (const manifest of manifests) gridEl.appendChild(buildPresetCard(manifest))
  if (activePresetFilename === 'custom') {
    const customCard = document.createElement('div')
    customCard.className = 'preset-card active'
    customCard.innerHTML = `
      <div class="preset-micro-preview" style="background:#f5f5f5">
        <div style="font-size:11px;color:#666;text-align:center;padding-top:20px;">${t('preset.custom')}</div>
      </div>
      <div class="preset-name">${t('preset.custom')}</div>
    `
    gridEl.appendChild(customCard)
  }
}

function buildPresetCard(manifest: StyleManifest): HTMLElement {
  const isActive = manifest.filename === activePresetFilename
  const h1Style  = manifest.markdownStyles.h1
  const pStyle   = manifest.markdownStyles.paragraph
  const bgMap: Record<string,string> = { 'dracula.json':'#282a36','solarized.json':'#fdf6e3' }
  const bg = bgMap[manifest.filename] ?? '#ffffff'

  const card = document.createElement('div')
  card.className = `preset-card ${isActive?'active':''}`
  card.dataset.presetFilename = manifest.filename

  const lockIcon   = manifest.builtIn ? '<span style="position:absolute;top:2px;right:2px;font-size:9px;opacity:0.6;">🔒</span>' : ''
  const actionsHTML = !manifest.builtIn ? `
    <div class="preset-card-actions" style="display:flex;justify-content:center;gap:2px;padding:2px;">
      <button class="reset-btn preset-rename-btn" data-filename="${manifest.filename}" data-name="${manifest.name}" style="padding:1px 5px;font-size:9px;" title="${t('preset.rename')}">✎</button>
      <button class="reset-btn preset-delete-btn" data-filename="${manifest.filename}" data-name="${manifest.name}" style="padding:1px 5px;font-size:9px;color:#c00;" title="${t('preset.delete')}">✕</button>
    </div>
  ` : '<div style="height:20px;"></div>'

  card.innerHTML = `
    <div class="preset-micro-preview" style="background:${bg};position:relative;">
      ${lockIcon}
      <div style="font-family:${h1Style.fontFamily};font-size:12px;font-weight:${h1Style.fontWeight};color:${h1Style.color};margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${manifest.name}</div>
      <div style="font-family:${pStyle.fontFamily};font-size:9px;color:${pStyle.color};line-height:1.4;">Sample text</div>
    </div>
    <div class="preset-name">${manifest.name}</div>
    ${actionsHTML}
  `

  card.addEventListener('click', async (e) => {
    if ((e.target as HTMLElement).closest('.preset-rename-btn') || (e.target as HTMLElement).closest('.preset-delete-btn')) return
    const panel = document.getElementById('settings-panel')!
    currentStyles = JSON.parse(JSON.stringify(manifest.markdownStyles))
    currentRules  = JSON.parse(JSON.stringify(manifest.customRules ?? []))
    markNamedPreset(manifest.filename)
    refreshAllControls(panel)
    renderCustomRulesList(panel)
    window.electronAPI.setConfig('activePreset', manifest.filename)
    notifyChange()
    reloadStylesList()
  })

  card.querySelector<HTMLButtonElement>('.preset-rename-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation()
    const btn = e.currentTarget as HTMLButtonElement
    const filename = btn.dataset.filename!
    const currentName = btn.dataset.name!
    const nameEl = card.querySelector<HTMLElement>('.preset-name')!
    const input = document.createElement('input')
    input.type = 'text'; input.value = currentName
    input.style.cssText = 'width:100%;font-size:10px;padding:1px 2px;border:1px solid var(--border-color);border-radius:2px;background:var(--bg-primary);color:var(--text-primary);'
    nameEl.innerHTML = ''; nameEl.appendChild(input)
    input.focus(); input.select()
    const doRename = async () => {
      const newName = input.value.trim()
      if (newName && newName !== currentName) await window.electronAPI.stylesRename(filename, newName)
      await reloadStylesList()
    }
    input.addEventListener('keydown', async ke => { if (ke.key==='Enter') await doRename(); if (ke.key==='Escape') await reloadStylesList() })
    input.addEventListener('blur', doRename)
  })

  card.querySelector<HTMLButtonElement>('.preset-delete-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation()
    const btn = e.currentTarget as HTMLButtonElement
    const filename = btn.dataset.filename!
    const name = btn.dataset.name!
    if (!confirm(t('preset.deleteConfirm', { name }))) return
    await window.electronAPI.stylesDelete(filename)
    if (activePresetFilename === filename) { activePresetFilename='default.json'; window.electronAPI.setConfig('activePreset','default.json') }
    await reloadStylesList()
  })

  return card
}

// ---- Rule form wiring ----

function wireRuleForm(formEl: HTMLElement, panel: HTMLElement, editId: string | null): void {
  const triggerTypeEl     = formEl.querySelector<HTMLSelectElement>('#rf-trigger-type')!
  const triggerRowEl      = formEl.querySelector<HTMLElement>('#rf-trigger-row')!
  const triggerEl         = formEl.querySelector<HTMLInputElement>('#rf-trigger')!
  const indicatorEl       = formEl.querySelector('#rf-regex-indicator')!
  const colorEl           = formEl.querySelector<HTMLInputElement>('#rf-color')!
  const colorHexEl        = formEl.querySelector<HTMLInputElement>('#rf-color-hex')!
  const boldBtn           = formEl.querySelector<HTMLButtonElement>('#rf-bold')!
  const italicBtn         = formEl.querySelector<HTMLButtonElement>('#rf-italic')!
  const previewEl         = formEl.querySelector<HTMLElement>('#rf-preview')!
  const markerSelectRow   = formEl.querySelector<HTMLElement>('#rf-marker-select-row')!
  const markerSymbolRow   = formEl.querySelector<HTMLElement>('#rf-marker-symbol-row')!
  const charReplaceRows   = formEl.querySelector<HTMLElement>('#rf-char-replace-rows')!
  const markerSelectEl    = formEl.querySelector<HTMLSelectElement>('#rf-marker-select')!
  const markerSymbolInput = formEl.querySelector<HTMLInputElement>('#rf-marker-symbol')!
  const emojiPickerEl     = formEl.querySelector<HTMLElement>('#rf-emoji-picker')!
  const charTriggerEl     = formEl.querySelector<HTMLInputElement>('#rf-char-trigger')!
  const charReplacementEl = formEl.querySelector<HTMLInputElement>('#rf-char-replacement')!
  const charScopeEl       = formEl.querySelector<HTMLSelectElement>('#rf-char-scope')!
  const replacePresetEl   = formEl.querySelector<HTMLSelectElement>('#rf-replace-preset')!

  function updateTypeUI(): void {
    const type = triggerTypeEl.value
    triggerRowEl.style.display    = (type==='list-marker'||type==='char-replace') ? 'none' : ''
    markerSelectRow.style.display = type==='list-marker'  ? '' : 'none'
    markerSymbolRow.style.display = type==='list-marker'  ? '' : 'none'
    charReplaceRows.style.display = type==='char-replace' ? '' : 'none'
    if (type==='inline-regex') triggerEl.placeholder = '/pattern/gi'
    else if (type==='line-prefix') triggerEl.placeholder = '^'
  }

  function validateRegex(): void {
    if (triggerTypeEl.value!=='inline-regex') { indicatorEl.textContent=''; return }
    const m = triggerEl.value.match(/^\/(.+)\/([gimsuy]*)$/)
    if (!m) { indicatorEl.textContent='✗'; (indicatorEl as HTMLElement).style.color='red'; return }
    try { new RegExp(m[1],m[2]); indicatorEl.textContent='✓'; (indicatorEl as HTMLElement).style.color='green' }
    catch { indicatorEl.textContent='✗'; (indicatorEl as HTMLElement).style.color='red' }
  }

  function updatePreview(): void {
    previewEl.style.fontFamily  = formEl.querySelector<HTMLSelectElement>('#rf-font-family')!.value
    previewEl.style.fontSize    = `${Math.min(parseInt(formEl.querySelector<HTMLInputElement>('#rf-font-size')!.value)||16,18)}px`
    previewEl.style.fontWeight  = boldBtn.classList.contains('active') ? 'bold' : 'normal'
    previewEl.style.fontStyle   = italicBtn.classList.contains('active') ? 'italic' : 'normal'
    previewEl.style.color       = colorEl.value
  }

  triggerTypeEl.addEventListener('change', () => { updateTypeUI(); validateRegex() })
  triggerEl.addEventListener('input', validateRegex)
  colorEl.addEventListener('input', () => { colorHexEl.value=colorEl.value; updatePreview() })
  colorHexEl.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(colorHexEl.value)) { colorEl.value=colorHexEl.value; updatePreview() }
  })
  formEl.querySelector('#rf-font-family')?.addEventListener('change', updatePreview)
  formEl.querySelector('#rf-font-size')?.addEventListener('input', updatePreview)
  boldBtn.addEventListener('click',   () => { boldBtn.classList.toggle('active'); updatePreview() })
  italicBtn.addEventListener('click', () => { italicBtn.classList.toggle('active'); updatePreview() })

  replacePresetEl?.addEventListener('change', () => {
    const val = replacePresetEl.value
    if (!val) return
    const [trigger, replacement] = val.split('|')
    if (charTriggerEl)     charTriggerEl.value     = trigger
    if (charReplacementEl) charReplacementEl.value  = replacement
    replacePresetEl.value = ''
  })

  formEl.querySelector('#rf-emoji-btn')?.addEventListener('click', e => {
    e.stopPropagation()
    emojiPickerEl.style.display = emojiPickerEl.style.display==='flex' ? 'none' : 'flex'
  })
  emojiPickerEl.querySelectorAll('.rf-emoji-sym').forEach(btn => {
    btn.addEventListener('click', () => { markerSymbolInput.value=(btn as HTMLElement).dataset.sym??''; emojiPickerEl.style.display='none' })
  })

  formEl.querySelector('#rf-cancel')?.addEventListener('click', () => {
    addingRule=false; formEl.innerHTML=''; formEl.style.display='none'
  })

  formEl.querySelector('#rf-save')?.addEventListener('click', () => {
    const name        = (formEl.querySelector<HTMLInputElement>('#rf-name')!.value||'Unnamed Rule').trim()
    const triggerType = triggerTypeEl.value as CustomFormatRule['triggerType']
    let trigger: string
    let markerSymbol: string|undefined
    let replacement:  string|undefined
    let scope:        CustomFormatRule['scope']

    if (triggerType==='list-marker') {
      trigger = markerSelectEl.value
      markerSymbol = markerSymbolInput.value.trim() || undefined
    } else if (triggerType==='char-replace') {
      trigger     = charTriggerEl.value.trim()
      replacement = charReplacementEl.value
      scope       = (charScopeEl.value as CustomFormatRule['scope']) ?? 'outside-code'
    } else {
      trigger = triggerEl.value.trim()
    }

    const style: ElementStyle = {
      fontFamily:   formEl.querySelector<HTMLSelectElement>('#rf-font-family')!.value,
      fontSize:     parseInt(formEl.querySelector<HTMLInputElement>('#rf-font-size')!.value)||16,
      fontWeight:   boldBtn.classList.contains('active') ? 'bold' : 'normal',
      fontStyle:    italicBtn.classList.contains('active') ? 'italic' : 'normal',
      color:        colorEl.value,
      lineHeight:   1.6,
      marginBottom: 0
    }

    if (editId) {
      const idx = currentRules.findIndex(r => r.id===editId)
      if (idx!==-1) currentRules[idx] = { ...currentRules[idx], name, triggerType, trigger, markerSymbol, replacement, scope, style }
    } else {
      currentRules.push({ id: Date.now().toString(36), name, triggerType, trigger, markerSymbol, replacement, scope, style, enabled: true })
    }

    addingRule=false; formEl.innerHTML=''; formEl.style.display='none'
    renderCustomRulesList(panel)
    notifyChange()
  })

  updateTypeUI(); validateRegex(); updatePreview()
}

function renderCustomRulesList(panel: HTMLElement): void {
  const listEl = document.getElementById('custom-rules-list')
  if (!listEl) return

  if (currentRules.length===0) {
    listEl.innerHTML = `<div style="color:var(--text-secondary);font-size:12px;padding:4px 0;">${t('rules.noRules')}</div>`
    return
  }

  const getBadge = (rule: CustomFormatRule) => {
    const m: Record<string,string> = {
      'line-prefix': t('rules.badge.prefix'), 'inline-regex': t('rules.badge.regex'),
      'list-marker': t('rules.badge.marker'), 'char-replace': t('rules.badge.replace')
    }
    return m[rule.triggerType] ?? rule.triggerType
  }

  listEl.innerHTML = currentRules.map((rule,idx) => `
    <div class="rule-item" data-rule-id="${rule.id}" style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border-color);">
      <button class="toggle-btn ${rule.enabled?'active':''}" data-rule-toggle="${rule.id}" style="font-size:10px;padding:2px 6px;">${rule.enabled?t('rules.enabled.on'):t('rules.enabled.off')}</button>
      <span style="flex:1;font-size:12px;">${rule.name} <span style="color:var(--text-secondary);">(${getBadge(rule)}: ${rule.trigger}${rule.markerSymbol?' → '+rule.markerSymbol:''}${rule.replacement?' → '+rule.replacement:''})</span></span>
      ${idx>0?`<button class="reset-btn" data-rule-up="${rule.id}" style="padding:2px 4px;" title="${t('rules.moveUp')}">&#x2191;</button>`:'<span style="width:24px;"></span>'}
      ${idx<currentRules.length-1?`<button class="reset-btn" data-rule-down="${rule.id}" style="padding:2px 4px;" title="${t('rules.moveDown')}">&#x2193;</button>`:'<span style="width:24px;"></span>'}
      <button class="reset-btn" data-rule-edit="${rule.id}">${t('rules.edit')}</button>
      <button class="reset-btn" data-rule-delete="${rule.id}">✕</button>
    </div>
  `).join('')

  listEl.querySelectorAll('[data-rule-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rule = currentRules.find(r=>r.id===(btn as HTMLElement).dataset.ruleToggle)
      if (rule) { rule.enabled=!rule.enabled; renderCustomRulesList(panel); notifyChange() }
    })
  })
  listEl.querySelectorAll('[data-rule-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRules = currentRules.filter(r=>r.id!==(btn as HTMLElement).dataset.ruleDelete)
      renderCustomRulesList(panel); notifyChange()
    })
  })
  listEl.querySelectorAll('[data-rule-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = currentRules.findIndex(r=>r.id===(btn as HTMLElement).dataset.ruleUp)
      if (idx>0) { [currentRules[idx-1],currentRules[idx]]=[currentRules[idx],currentRules[idx-1]] }
      renderCustomRulesList(panel); notifyChange()
    })
  })
  listEl.querySelectorAll('[data-rule-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = currentRules.findIndex(r=>r.id===(btn as HTMLElement).dataset.ruleDown)
      if (idx<currentRules.length-1) { [currentRules[idx],currentRules[idx+1]]=[currentRules[idx+1],currentRules[idx]] }
      renderCustomRulesList(panel); notifyChange()
    })
  })
  listEl.querySelectorAll('[data-rule-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (addingRule) return
      addingRule = true
      const id   = (btn as HTMLElement).dataset.ruleEdit!
      const rule = currentRules.find(r=>r.id===id)
      if (!rule) return
      const formEl = document.getElementById('add-rule-form')!
      formEl.innerHTML = buildRuleFormHTML(rule)
      formEl.style.display = 'block'
      const rfFont = formEl.querySelector<HTMLSelectElement>('#rf-font-family')
      if (rfFont) { rfFont.value=rule.style.fontFamily; if (rfFont.value!==rule.style.fontFamily) setFontSelectorWithCustom(rfFont, rule.style.fontFamily) }
      wireRuleForm(formEl, panel, id)
    })
  })
}

// ---- Control change handlers ----

function handleControlChange(e: Event, panel: HTMLElement): void {
  const target     = e.target as HTMLInputElement | HTMLSelectElement
  const prop       = target.dataset.prop as string
  const elementKey = target.dataset.element as StyleKey

  if (!prop || !elementKey || !getElementLabels()[elementKey]) return
  const style = currentStyles[elementKey]

  if (prop==='fontFamily') {
    const val = (target as HTMLSelectElement).value; if (val!=='__custom__') style.fontFamily=val
  } else if (prop==='fontSize') {
    style.fontSize = parseFloat(target.value) || style.fontSize
  } else if (prop==='color') {
    style.color = target.value
    const hex = panel.querySelector<HTMLInputElement>(`input[data-prop="colorHex"][data-element="${elementKey}"]`)
    if (hex) hex.value = target.value
  } else if (prop==='colorHex') {
    if (/^#[0-9a-fA-F]{6}$/.test(target.value.trim())) {
      style.color = target.value.trim()
      const col = panel.querySelector<HTMLInputElement>(`input[type="color"][data-prop="color"][data-element="${elementKey}"]`)
      if (col) col.value = style.color
    }
  } else if (prop==='lineHeight') {
    style.lineHeight = parseFloat(target.value)
    const disp = panel.querySelector(`[data-display="lineHeight"][data-element="${elementKey}"]`)
    if (disp) disp.textContent = style.lineHeight.toFixed(1)
  } else if (prop==='marginBottom') {
    style.marginBottom = parseFloat(target.value) || 0
  } else if (prop==='listStyleType') {
    const val = (target as HTMLSelectElement).value; if (val!=='__custom__') style.listStyleType=val
  } else if (prop==='listStyleTypeCustom') {
    const val = target.value.trim()
    if (val) {
      style.listStyleType = val
      const sel = panel.querySelector<HTMLSelectElement>(`#lst-type-${elementKey}`)
      if (sel) {
        sel.querySelectorAll('[data-custom-type]').forEach(o=>o.remove())
        const opt = document.createElement('option'); opt.value=val; opt.textContent=`Custom: ${val}`; opt.dataset.customType='true'; opt.selected=true
        sel.appendChild(opt)
      }
    }
  } else if (prop==='listStyleColor') {
    style.listStyleColor = target.value
    const hex = panel.querySelector<HTMLInputElement>(`input[data-prop="listStyleColorHex"][data-element="${elementKey}"]`)
    if (hex) hex.value = target.value
  } else if (prop==='listStyleColorHex') {
    const hex = target.value.trim()
    if (!hex) { style.listStyleColor=undefined }
    else if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      style.listStyleColor = hex
      const col = panel.querySelector<HTMLInputElement>(`input[type="color"][data-prop="listStyleColor"][data-element="${elementKey}"]`)
      if (col) col.value = hex
    }
  } else if (prop==='listIndent') {
    style.listIndent = Math.max(8, Math.min(80, parseFloat(target.value)||24))
  } else if (prop==='backgroundColor') {
    style.backgroundColor = target.value
    const hex = panel.querySelector<HTMLInputElement>(`input[data-prop="backgroundColorHex"][data-element="${elementKey}"]`)
    if (hex) hex.value = target.value
  } else if (prop==='backgroundColorHex') {
    const hex = target.value.trim()
    if (!hex) { style.backgroundColor=undefined }
    else if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      style.backgroundColor = hex
      const col = panel.querySelector<HTMLInputElement>(`input[type="color"][data-prop="backgroundColor"][data-element="${elementKey}"]`)
      if (col) col.value = hex
    }
  }

  updatePreviewSnippet(elementKey)
  markCustomPreset(panel)
  notifyChange()
}

function handleButtonClick(e: Event, panel: HTMLElement): void {
  const target     = e.target as HTMLButtonElement
  const action     = target.dataset.action
  const prop       = target.dataset.prop as string
  const elementKey = target.dataset.element as StyleKey
  const value      = target.dataset.value

  if (!elementKey || !getElementLabels()[elementKey]) return
  const style = currentStyles[elementKey]

  if (prop==='listStyleColorClear') {
    style.listStyleColor = undefined
    const col = panel.querySelector<HTMLInputElement>(`input[type="color"][data-prop="listStyleColor"][data-element="${elementKey}"]`)
    if (col) col.value = '#000000'
    const hex = panel.querySelector<HTMLInputElement>(`input[data-prop="listStyleColorHex"][data-element="${elementKey}"]`)
    if (hex) hex.value = ''
    updatePreviewSnippet(elementKey); markCustomPreset(panel); notifyChange(); return
  }
  if (prop==='backgroundColorClear') {
    style.backgroundColor = undefined
    const col = panel.querySelector<HTMLInputElement>(`input[type="color"][data-prop="backgroundColor"][data-element="${elementKey}"]`)
    if (col) col.value = '#ffffff'
    const hex = panel.querySelector<HTMLInputElement>(`input[data-prop="backgroundColorHex"][data-element="${elementKey}"]`)
    if (hex) hex.value = ''
    updatePreviewSnippet(elementKey); markCustomPreset(panel); notifyChange(); return
  }

  if (action==='decrease' || action==='increase') {
    const delta = action==='increase' ? 1 : -1
    if (prop==='fontSize') {
      style.fontSize = Math.max(8, Math.min(72, style.fontSize+delta))
      const inp = panel.querySelector<HTMLInputElement>(`input[type="number"][data-prop="fontSize"][data-element="${elementKey}"]`)
      if (inp) inp.value = String(style.fontSize)
    } else if (prop==='marginBottom') {
      style.marginBottom = Math.max(0, Math.min(100, (style.marginBottom||0)+delta))
      const inp = panel.querySelector<HTMLInputElement>(`input[type="number"][data-prop="marginBottom"][data-element="${elementKey}"]`)
      if (inp) inp.value = String(style.marginBottom)
    }
    updatePreviewSnippet(elementKey); markCustomPreset(panel); notifyChange()
  } else if (value && (prop==='fontWeight' || prop==='fontStyle')) {
    style[prop] = style[prop]===value ? 'normal' : value
    target.classList.toggle('active', style[prop]===value)
    updatePreviewSnippet(elementKey); markCustomPreset(panel); notifyChange()
  }
}

// ---- Refresh helpers ----

function setFontSelectorWithCustom(select: HTMLSelectElement, value: string): void {
  select.querySelectorAll('[data-custom-font]').forEach(o=>o.remove())
  if (FONT_OPTIONS.find(opt=>opt.value===value)) {
    select.value = value
  } else {
    const opt = document.createElement('option')
    opt.value = value; opt.textContent = `Custom: ${value.slice(0,25)}${value.length>25?'…':''}`; opt.dataset.customFont='true'
    select.insertBefore(opt, select.firstChild); select.value = value
  }
}

function refreshElementControls(panel: HTMLElement, key: StyleKey): void {
  const style = currentStyles[key]

  const fontSel = panel.querySelector<HTMLSelectElement>(`select[data-prop="fontFamily"][data-element="${key}"]`)
  if (fontSel) setFontSelectorWithCustom(fontSel, style.fontFamily)

  const fsInp = panel.querySelector<HTMLInputElement>(`input[type="number"][data-prop="fontSize"][data-element="${key}"]`)
  if (fsInp) fsInp.value = String(style.fontSize)

  const boldBtn = panel.querySelector<HTMLButtonElement>(`button[data-prop="fontWeight"][data-element="${key}"]`)
  if (boldBtn) boldBtn.classList.toggle('active', style.fontWeight==='bold')

  const italicBtn = panel.querySelector<HTMLButtonElement>(`button[data-prop="fontStyle"][data-element="${key}"]`)
  if (italicBtn) italicBtn.classList.toggle('active', style.fontStyle==='italic')

  const colInp = panel.querySelector<HTMLInputElement>(`input[type="color"][data-prop="color"][data-element="${key}"]`)
  if (colInp) colInp.value = style.color
  const hexInp = panel.querySelector<HTMLInputElement>(`input[data-prop="colorHex"][data-element="${key}"]`)
  if (hexInp) hexInp.value = style.color

  const lhInp = panel.querySelector<HTMLInputElement>(`input[type="range"][data-prop="lineHeight"][data-element="${key}"]`)
  if (lhInp) lhInp.value = String(style.lineHeight)
  const lhDisp = panel.querySelector(`[data-display="lineHeight"][data-element="${key}"]`)
  if (lhDisp) lhDisp.textContent = style.lineHeight.toFixed(1)

  const mbInp = panel.querySelector<HTMLInputElement>(`input[type="number"][data-prop="marginBottom"][data-element="${key}"]`)
  if (mbInp) mbInp.value = String(style.marginBottom||0)

  if (BG_ELEMENTS.includes(key)) {
    const bgCol = panel.querySelector<HTMLInputElement>(`input[type="color"][data-prop="backgroundColor"][data-element="${key}"]`)
    if (bgCol) bgCol.value = style.backgroundColor ?? '#ffffff'
    const bgHex = panel.querySelector<HTMLInputElement>(`input[data-prop="backgroundColorHex"][data-element="${key}"]`)
    if (bgHex) bgHex.value = style.backgroundColor ?? ''
  }

  if (LIST_ELEMENTS.includes(key)) {
    const lstSel = panel.querySelector<HTMLSelectElement>(`#lst-type-${key}`)
    if (lstSel) {
      const known = Array.from(lstSel.options).map(o=>o.value).filter(v=>v!=='__custom__')
      if (known.includes(style.listStyleType??'')) {
        lstSel.value = style.listStyleType ?? (key==='unorderedList'?'disc':'decimal')
      } else if (style.listStyleType) {
        lstSel.querySelectorAll('[data-custom-type]').forEach(o=>o.remove())
        const opt=document.createElement('option'); opt.value=style.listStyleType; opt.textContent=`Custom: ${style.listStyleType}`; opt.dataset.customType='true'; opt.selected=true
        lstSel.appendChild(opt)
      }
      const customRow = document.getElementById(`lst-custom-row-${key}`)
      if (customRow) customRow.style.display = 'none'
    }
    const lcCol = panel.querySelector<HTMLInputElement>(`input[type="color"][data-prop="listStyleColor"][data-element="${key}"]`)
    if (lcCol) lcCol.value = style.listStyleColor ?? '#000000'
    const lcHex = panel.querySelector<HTMLInputElement>(`input[data-prop="listStyleColorHex"][data-element="${key}"]`)
    if (lcHex) lcHex.value = style.listStyleColor ?? ''
    const liInp = panel.querySelector<HTMLInputElement>(`input[data-prop="listIndent"][data-element="${key}"]`)
    if (liInp) liInp.value = String(style.listIndent ?? 24)
  }

  updatePreviewSnippet(key)
}

function refreshAllControls(panel: HTMLElement): void {
  const elements = Object.keys(getElementLabels()) as StyleKey[]
  elements.forEach(key => refreshElementControls(panel, key))
}

function markCustomPreset(_panel: HTMLElement): void {
  if (activePresetFilename !== 'custom') {
    activePresetFilename = 'custom'
    window.electronAPI.setConfig('activePreset', 'custom')
    const gridEl = document.getElementById('presets-grid')
    if (gridEl && cachedManifests) renderPresetsGrid(gridEl, cachedManifests)
    const saveBtn = document.getElementById('btn-save-to-preset') as HTMLElement | null
    if (saveBtn) saveBtn.style.display = 'none'
  }
}

function markNamedPreset(filename: string): void {
  activePresetFilename = filename
  const saveBtn = document.getElementById('btn-save-to-preset') as HTMLElement | null
  if (saveBtn) saveBtn.style.display = ''
}

function updatePreviewSnippet(key: StyleKey): void {
  const style = currentStyles[key]
  const el = document.getElementById(`preview-${key}`)
  if (!el) return
  el.style.fontFamily  = style.fontFamily
  el.style.fontSize    = `${Math.min(style.fontSize, 20)}px`
  el.style.fontWeight  = style.fontWeight
  el.style.fontStyle   = style.fontStyle
  el.style.color       = style.color
  el.style.lineHeight  = String(style.lineHeight)
  el.textContent       = `${getElementLabels()[key]} — Sample text`
}

// ---- Notifications / Save ----

function notifyChange(): void {
  onChangeCallback(currentStyles, currentRules)
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  saveDebounceTimer = setTimeout(() => {
    window.electronAPI.setConfig('markdownStyles', JSON.parse(JSON.stringify(currentStyles)))
    window.electronAPI.setConfig('customRules',    JSON.parse(JSON.stringify(currentRules)))
  }, 300)
}

// ---- Toast ----

function showToast(msg: string): void {
  const toast = document.createElement('div')
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:var(--bg-tertiary);color:var(--text-primary);padding:8px 16px;border-radius:6px;font-size:13px;border:1px solid var(--border-color);z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);'
  toast.textContent = msg
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

// ---- Panel open/close ----

export async function openPanel(): Promise<void> {
  const panel   = document.getElementById('settings-panel')!
  const overlay = document.getElementById('settings-overlay')!
  panel.classList.add('open')
  overlay.classList.add('visible')
  await reloadStylesList()
}

export function closePanel(): void {
  document.getElementById('settings-panel')!.classList.remove('open')
  document.getElementById('settings-overlay')!.classList.remove('visible')
}

void getLanguage
