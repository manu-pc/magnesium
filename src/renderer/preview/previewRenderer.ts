import type { FileLanguage } from '../editor/editorSetup'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import type { MarkdownStyles, CustomFormatRule } from '../../shared/types'
import { generateCSS, generatePrintCSS } from '../settings/styleEngine'

// ---- Extended list marker remark plugin ----
//
// Attaches data-marker (source character) and data-marker-type / data-marker-sep
// to every list item so custom rules can match them.
//
// Supported unordered markers:  - * + > ~ : ! ? # @ $ % & = ^ | \
// Supported ordered markers:    digit+period, digit+paren, alpha+period, alpha+paren

const UNORDERED_MARKER_RE = /^\s*([-*+>~:!?#@$%&=^|\\])\s/
const ORDERED_DIGIT_RE    = /^\s*(\d+)([.)])\s/
const ORDERED_ALPHA_RE    = /^\s*([a-zA-Z])([.)])\s/

function remarkListMarker() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any, file: any) => {
    const src = String(file)
    const lines = src.split('\n')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function walk(node: any) {
      if (node.type === 'list') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.children.forEach((item: any) => {
          if (!item.position) return
          const lineIdx = item.position.start.line - 1
          const line = lines[lineIdx] ?? ''

          if (!item.data) item.data = {}
          if (!item.data.hProperties) item.data.hProperties = {}

          if (!node.ordered) {
            const m = line.match(UNORDERED_MARKER_RE)
            item.data.hProperties['data-marker'] = m ? m[1] : '-'
          } else {
            const dm = line.match(ORDERED_DIGIT_RE)
            const am = line.match(ORDERED_ALPHA_RE)
            if (dm) {
              item.data.hProperties['data-marker-type'] = 'ordered'
              item.data.hProperties['data-marker-sep'] = dm[2]
              item.data.hProperties['data-marker'] = 'ordered:' + dm[2]
            } else if (am) {
              const isLower = am[1] === am[1].toLowerCase()
              const style = isLower ? 'alpha' : 'ALPHA'
              item.data.hProperties['data-marker-type'] = 'ordered'
              item.data.hProperties['data-marker-sep'] = am[2]
              item.data.hProperties['data-marker'] = 'ordered:' + style + am[2]
            }
          }
        })
      }
      if (node.children) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.children.forEach((child: any) => walk(child))
      }
    }
    walk(tree)
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .use(remarkListMarker as any)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(rehypeStringify, { allowDangerousHtml: true })

function escapeRegexStr(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---- char-replace post-processing ----
//
// Operates on the HTML string, carefully skipping content inside code/pre tags.

function applyCharReplace(html: string, rules: CustomFormatRule[]): string {
  // Extract enabled char-replace rules, applied first (spec requirement)
  const charRules = rules.filter(r => r.enabled && r.triggerType === 'char-replace' && r.trigger && r.replacement)
  if (charRules.length === 0) return html

  // Split the HTML into segments: code blocks, pre blocks, and everything else.
  // Pattern: captures <pre...>...</pre> and <code...>...</code> as atomic blocks.
  // We process text segments between them.

  // Strategy: split on code/pre tags, apply replacement only in text segments
  // depending on scope.
  const segments = splitHtmlByCodeBlocks(html)

  let result = ''
  for (const seg of segments) {
    if (seg.isCode) {
      result += seg.content
      continue
    }
    let text = seg.content
    for (const rule of charRules) {
      const scope = rule.scope ?? 'outside-code'
      if (scope === 'inline-only') {
        // Only inside <p>, <li>, etc. but not in block-level contexts — skip for now,
        // treat same as outside-code (we already skip pre/code blocks above)
        // This is a best-effort approximation; full DOM traversal would require a browser.
      }
      const escaped = escapeRegexStr(rule.trigger)
      const re = new RegExp(escaped, 'g')
      const replacement = rule.replacement!
      if (rule.style) {
        text = text.replace(re, `<span class="custom-rule-${rule.id}">${replacement}</span>`)
      } else {
        text = text.replace(re, replacement)
      }
    }
    result += text
  }
  return result
}

interface HtmlSegment { content: string; isCode: boolean }

function splitHtmlByCodeBlocks(html: string): HtmlSegment[] {
  const segments: HtmlSegment[] = []
  // Match <pre ...>...</pre> and <code ...>...</code> blocks
  const CODE_RE = /(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/gi
  let lastIndex = 0
  let m: RegExpExecArray | null

  CODE_RE.lastIndex = 0
  while ((m = CODE_RE.exec(html)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ content: html.slice(lastIndex, m.index), isCode: false })
    }
    segments.push({ content: m[0], isCode: true })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < html.length) {
    segments.push({ content: html.slice(lastIndex), isCode: false })
  }
  return segments
}

// ---- Other custom rules post-processing ----

function applyCustomRules(html: string, rules: CustomFormatRule[]): string {
  // Apply char-replace first
  let result = applyCharReplace(html, rules)

  for (const rule of rules) {
    if (!rule.enabled) continue
    if (rule.triggerType === 'char-replace') continue  // already applied

    if (rule.triggerType === 'line-prefix') {
      const prefix = rule.trigger
      if (!prefix) continue
      const escapedPrefix = escapeRegexStr(prefix)
      result = result.replace(/<p>([\s\S]*?)<\/p>/g, (match, content) => {
        const textContent = content.replace(/<[^>]+>/g, '').trimStart()
        if (textContent.startsWith(prefix)) {
          const cleanContent = content.replace(
            new RegExp(`(^|>)${escapedPrefix}`),
            '$1'
          )
          return `<p><span class="custom-rule-${rule.id}">${cleanContent}</span></p>`
        }
        return match
      })
    } else if (rule.triggerType === 'inline-regex') {
      const regexMatch = rule.trigger.match(/^\/(.+)\/([gimsuy]*)$/)
      if (!regexMatch) continue
      try {
        const flags = regexMatch[2].includes('g') ? regexMatch[2] : `g${regexMatch[2]}`
        const regex = new RegExp(regexMatch[1], flags)
        result = result.replace(/>([^<]+)</g, (_m, textNode: string) => {
          const replaced = textNode.replace(regex, `<span class="custom-rule-${rule.id}">$&</span>`)
          return `>${replaced}<`
        })
      } catch {
        // invalid regex — skip
      }
    } else if (rule.triggerType === 'list-marker') {
      const marker = rule.trigger
      if (!marker) continue

      let attrPattern: RegExp

      if (marker.startsWith('ordered:')) {
        // Match ordered list items by sep or style
        const rest = marker.slice('ordered:'.length)
        if (rest === '.' || rest === ')') {
          // Match by separator
          const escapedSep = escapeRegexStr(rest)
          attrPattern = new RegExp(
            `(<li)((?:[^>]*?))data-marker-sep="${escapedSep}"((?:[^>]*?))>`,
            'g'
          )
        } else {
          // ordered:alpha, ordered:ALPHA, ordered:roman etc — match by marker value
          const escapedMarker = escapeRegexStr(marker)
          attrPattern = new RegExp(
            `(<li)((?:[^>]*?))data-marker="[^"]*${escapedMarker}[^"]*"((?:[^>]*?))>`,
            'g'
          )
        }
      } else {
        const escapedMarker = escapeRegexStr(marker)
        attrPattern = new RegExp(
          `(<li)((?:[^>]*?))data-marker="${escapedMarker}"((?:[^>]*?))>`,
          'g'
        )
      }

      result = result.replace(attrPattern, (_match, tag, pre, post) => {
        const combined = pre + post
        if (/class="/.test(combined)) {
          return `${tag}${combined.replace(/class="/, `class="custom-rule-${rule.id} `)}>`
        }
        return `${tag}${combined} class="custom-rule-${rule.id}">`
      })

      // Inject custom marker symbol
      if (rule.markerSymbol) {
        result = result.replace(
          new RegExp(`(<li[^>]*class="[^"]*custom-rule-${rule.id}[^"]*"[^>]*>)`, 'g'),
          `$1<span class="custom-marker">${rule.markerSymbol}</span>`
        )
      }
    }
  }
  return result
}

// ---- Link click interceptor (attached once per preview pane) ----

function attachLinkInterceptor(previewPane: HTMLElement): void {
  if (previewPane.dataset.linkListenerAttached) return
  previewPane.dataset.linkListenerAttached = 'true'

  previewPane.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a')
    if (!target) return
    e.preventDefault()
    const href = target.getAttribute('href')
    if (!href) return

    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.electronAPI.openExternal(href)
    } else if (href.startsWith('#')) {
      const anchor = previewPane.querySelector(
        `[id="${href.slice(1)}"], [name="${href.slice(1)}"]`
      )
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth' })
    }
    // Relative file links: silently ignore
  })
}

// ---- Public API ----

function wrapTables(html: string): string {
  return html
    .replace(/<table>/g, '<div class="table-wrapper"><table>')
    .replace(/<\/table>/g, '</table></div>')
}

export async function updatePreview(
  markdown: string,
  styles: MarkdownStyles,
  container: HTMLElement,
  theme: 'light' | 'dark' = 'light',
  customRules: CustomFormatRule[] = []
): Promise<void> {
  const result = await processor.process(markdown)
  const rawHtml = wrapTables(String(result))
  container.innerHTML = applyCustomRules(rawHtml, customRules)

  let styleEl = document.getElementById('preview-custom-styles')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'preview-custom-styles'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = generateCSS(styles, theme, customRules)

  // Attach link interceptor to the parent pane (not the content div)
  const previewPane = container.parentElement ?? container
  attachLinkInterceptor(previewPane)
}

// Map FileLanguage to highlight.js language alias
function hlLang(lang: FileLanguage): string {
  switch (lang) {
    case 'cpp': return 'cpp'
    case 'java': return 'java'
    case 'python': return 'python'
    case 'html': return 'html'
    case 'css': return 'css'
    case 'javascript': return 'javascript'
    case 'typescript': return 'typescript'
    default: return 'plaintext'
  }
}

export function updateCodePreview(
  code: string,
  lang: FileLanguage,
  container: HTMLElement,
  theme: 'light' | 'dark' = 'light'
): void {
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const langClass = hlLang(lang)
  container.innerHTML = `<pre class="code-preview-pre"><code class="language-${langClass} hljs">${escapedCode}</code></pre>`

  // Apply highlight.js if available
  const codeEl = container.querySelector('code')
  if (codeEl && (window as unknown as { hljs?: { highlightElement: (el: Element) => void } }).hljs) {
    ;(window as unknown as { hljs: { highlightElement: (el: Element) => void } }).hljs.highlightElement(codeEl)
  }

  // Style the code preview container
  let styleEl = document.getElementById('code-preview-styles')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'code-preview-styles'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = `
    .code-preview-pre {
      margin: 0;
      padding: 20px;
      font-family: "Fira Code", "JetBrains Mono", "Cascadia Code", monospace;
      font-size: 14px;
      line-height: 1.6;
      background: ${theme === 'dark' ? '#1e1e1e' : '#f6f8fa'};
      color: ${theme === 'dark' ? '#d4d4d4' : '#24292e'};
      min-height: 100%;
      overflow: auto;
      white-space: pre;
    }
    .code-preview-pre code {
      background: transparent !important;
      padding: 0 !important;
    }
  `
}

export async function renderToHTMLString(
  markdown: string,
  styles: MarkdownStyles,
  customRules: CustomFormatRule[] = []
): Promise<string> {
  const result = await processor.process(markdown)
  const rawHtml = wrapTables(String(result))
  const bodyContent = applyCustomRules(rawHtml, customRules)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body {
  background-color: #ffffff;
  color: #1a1a1a;
  font-family: system-ui, sans-serif;
  padding: 40px;
}
#preview-content {
  max-width: 800px;
  margin: 0 auto;
}
pre {
  overflow-x: auto;
  border-radius: 4px;
  padding: 16px;
  background: #f6f8fa;
  color: #24292e;
}
img { max-width: 100%; height: auto; }
${generatePrintCSS(styles, customRules)}
</style>
</head>
<body>
<div id="preview-content">
${bodyContent}
</div>
</body>
</html>`
}
