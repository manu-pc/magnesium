import type { MarkdownStyles, ElementStyle, CustomFormatRule } from '../../shared/types'

// ---- Color adaptation for dark mode ----

function hexToRgb(hex: string): [number, number, number] | null {
  hex = hex.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, '#$1$1$2$2$3$3')
  const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Adapt a text color for readability on a dark background.
// Dark/black colors are lightened; already-light colors are kept.
function adaptColorForDark(color: string): string {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  const [h, s, l] = rgbToHsl(...rgb)
  if (l >= 0.6) return color  // already light enough
  if (s < 0.1) {
    // Achromatic (black/grays): invert lightness toward white
    return hslToHex(h, s, Math.min(0.9, 1 - l))
  }
  // Chromatic dark: boost lightness to 0.70–0.85 range, preserving hue
  const newL = 0.7 + (0.5 - Math.min(l, 0.5)) * 0.3
  return hslToHex(h, Math.min(s, 0.85), newL)
}

// Adapt a background color for a dark UI (light bgs become dark).
function adaptBgForDark(color: string): string {
  const rgb = hexToRgb(color)
  if (!rgb) return '#2d2d2d'
  const [h, s, l] = rgbToHsl(...rgb)
  if (l <= 0.3) return color  // already dark
  if (s < 0.1) return '#2d2d2d'  // achromatic light → standard dark surface
  return hslToHex(h, Math.min(s, 0.5), 0.15)  // chromatic light → dark with hue
}

// Adapt color hex values embedded in a CSS border string.
function adaptBorderForDark(border: string): string {
  return border.replace(/#[0-9a-fA-F]{3,6}/g, (c) => adaptColorForDark(c))
}

function adaptElementForDark(el: ElementStyle): ElementStyle {
  const adapted: ElementStyle = { ...el, color: adaptColorForDark(el.color) }
  if (el.backgroundColor !== undefined) adapted.backgroundColor = adaptBgForDark(el.backgroundColor)
  if (el.borderBottom !== undefined) adapted.borderBottom = adaptBorderForDark(el.borderBottom)
  if (el.listStyleColor !== undefined) adapted.listStyleColor = adaptColorForDark(el.listStyleColor)
  return adapted
}

function adaptStylesForDark(styles: MarkdownStyles): MarkdownStyles {
  return {
    h1: adaptElementForDark(styles.h1),
    h2: adaptElementForDark(styles.h2),
    h3: adaptElementForDark(styles.h3),
    h4: adaptElementForDark(styles.h4),
    paragraph: adaptElementForDark(styles.paragraph),
    bold: adaptElementForDark(styles.bold),
    italic: adaptElementForDark(styles.italic),
    inlineCode: adaptElementForDark(styles.inlineCode),
    codeBlock: adaptElementForDark(styles.codeBlock),
    blockquote: adaptElementForDark(styles.blockquote),
    unorderedList: adaptElementForDark(styles.unorderedList),
    orderedList: adaptElementForDark(styles.orderedList),
    link: adaptElementForDark(styles.link),
  }
}

// ---- CSS generation ----

function elementToCSS(selector: string, style: ElementStyle, isInline = false): string {
  const parts: string[] = [
    `font-family: ${style.fontFamily};`,
    `font-size: ${style.fontSize}px;`,
    `font-weight: ${style.fontWeight};`,
    `font-style: ${style.fontStyle};`,
    `color: ${style.color};`,
    `line-height: ${style.lineHeight};`
  ]
  if (!isInline) {
    parts.push(`margin-bottom: ${style.marginBottom}px;`)
  }
  if (style.backgroundColor !== undefined) {
    parts.push(`background-color: ${style.backgroundColor};`)
  }
  if (style.borderBottom !== undefined) {
    parts.push(`border-bottom: ${style.borderBottom};`)
    parts.push(`padding-bottom: 4px;`)
  }
  if (style.textTransform !== undefined) {
    parts.push(`text-transform: ${style.textTransform};`)
  }
  if (style.textAlign !== undefined) {
    parts.push(`text-align: ${style.textAlign};`)
  }
  return `#preview-content ${selector} {\n  ${parts.join('\n  ')}\n}`
}

export function generateCSS(
  styles: MarkdownStyles,
  theme: 'light' | 'dark' = 'light',
  customRules: CustomFormatRule[] = []
): string {
  const rules: string[] = []
  const s = theme === 'dark' ? adaptStylesForDark(styles) : styles

  if (theme === 'dark') {
    rules.push(`#preview-content {\n  background-color: #1e1e1e;\n}`)
  }

  rules.push(elementToCSS('h1', s.h1))
  rules.push(elementToCSS('h2', s.h2))
  rules.push(elementToCSS('h3', s.h3))
  rules.push(elementToCSS('h4', s.h4))
  rules.push(elementToCSS('p', s.paragraph))
  rules.push(elementToCSS('strong', s.bold, true))
  rules.push(elementToCSS('em', s.italic, true))

  // Inline code (not inside pre)
  const inlineStyle = s.inlineCode
  const inlineBg = inlineStyle.backgroundColor ?? (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(127,127,127,0.1)')
  rules.push(`#preview-content code:not(pre code) {
  font-family: ${inlineStyle.fontFamily};
  font-size: ${inlineStyle.fontSize}px;
  font-weight: ${inlineStyle.fontWeight};
  font-style: ${inlineStyle.fontStyle};
  color: ${inlineStyle.color};
  line-height: ${inlineStyle.lineHeight};
  background: ${inlineBg};
  padding: 2px 4px;
  border-radius: 3px;
}`)

  // Code block
  const codeStyle = s.codeBlock
  const codeBg = codeStyle.backgroundColor !== undefined ? `background-color: ${codeStyle.backgroundColor};` : ''
  rules.push(`#preview-content pre {
  font-family: ${codeStyle.fontFamily};
  font-size: ${codeStyle.fontSize}px;
  font-weight: ${codeStyle.fontWeight};
  font-style: ${codeStyle.fontStyle};
  color: ${codeStyle.color};
  line-height: ${codeStyle.lineHeight};
  margin-bottom: ${codeStyle.marginBottom}px;
  ${codeBg}
}`)

  // Blockquote
  const bqStyle = s.blockquote
  rules.push(`#preview-content blockquote {
  font-family: ${bqStyle.fontFamily};
  font-size: ${bqStyle.fontSize}px;
  font-weight: ${bqStyle.fontWeight};
  font-style: ${bqStyle.fontStyle};
  color: ${bqStyle.color};
  line-height: ${bqStyle.lineHeight};
  margin-bottom: ${bqStyle.marginBottom}px;
  border-left: 4px solid currentColor;
  padding-left: 16px;
}`)

  // Unordered list
  const ulStyle = s.unorderedList
  const ulIndent = ulStyle.listIndent ?? 24
  const ulListType = ulStyle.listStyleType ?? 'disc'
  rules.push(`#preview-content ul {
  padding-left: ${ulIndent}px;
}
#preview-content ul li {
  font-family: ${ulStyle.fontFamily};
  font-size: ${ulStyle.fontSize}px;
  font-weight: ${ulStyle.fontWeight};
  font-style: ${ulStyle.fontStyle};
  color: ${ulStyle.color};
  line-height: ${ulStyle.lineHeight};
  margin-bottom: ${ulStyle.marginBottom}px;
  list-style-type: ${ulListType};
}`)

  if (ulStyle.listStyleColor) {
    rules.push(`#preview-content ul li::marker { color: ${ulStyle.listStyleColor}; }`)
  }

  // Ordered list
  const olStyle = s.orderedList
  const olIndent = olStyle.listIndent ?? 24
  const olListType = olStyle.listStyleType ?? 'decimal'
  rules.push(`#preview-content ol {
  padding-left: ${olIndent}px;
}
#preview-content ol li {
  font-family: ${olStyle.fontFamily};
  font-size: ${olStyle.fontSize}px;
  font-weight: ${olStyle.fontWeight};
  font-style: ${olStyle.fontStyle};
  color: ${olStyle.color};
  line-height: ${olStyle.lineHeight};
  margin-bottom: ${olStyle.marginBottom}px;
  list-style-type: ${olListType};
}`)

  if (olStyle.listStyleColor) {
    rules.push(`#preview-content ol li::marker { color: ${olStyle.listStyleColor}; }`)
  }

  // Link
  const linkStyle = s.link
  rules.push(`#preview-content a {
  font-family: ${linkStyle.fontFamily};
  font-size: ${linkStyle.fontSize}px;
  font-weight: ${linkStyle.fontWeight};
  font-style: ${linkStyle.fontStyle};
  color: ${linkStyle.color};
  line-height: ${linkStyle.lineHeight};
  text-decoration: none;
}
#preview-content a:hover {
  opacity: 0.8;
  text-decoration: underline;
}`)

  // Custom rules CSS
  for (const rule of customRules) {
    if (!rule.enabled) continue
    const rs = theme === 'dark' ? adaptElementForDark(rule.style) : rule.style
    if (rule.triggerType === 'list-marker') {
      const hasMarker = !!rule.markerSymbol
      rules.push(`#preview-content li.custom-rule-${rule.id} {
  font-family: ${rs.fontFamily};
  font-size: ${rs.fontSize}px;
  font-weight: ${rs.fontWeight};
  font-style: ${rs.fontStyle};
  color: ${rs.color};
  line-height: ${rs.lineHeight};${hasMarker ? '\n  list-style-type: none;' : ''}
}${hasMarker ? `
#preview-content li.custom-rule-${rule.id} .custom-marker {
  margin-right: 0.5em;
  color: ${rs.color};
}` : ''}`)
    } else {
      rules.push(elementToCSS(`.custom-rule-${rule.id}`, rs, true))
    }
  }

  return rules.join('\n\n')
}

export function generatePrintCSS(
  styles: MarkdownStyles,
  customRules: CustomFormatRule[] = []
): string {
  return `* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
${generateCSS(styles, 'light', customRules)}`
}
