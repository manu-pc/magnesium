import { WidgetType, Decoration, DecorationSet, ViewPlugin, ViewUpdate, EditorView } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

const IMAGE_DATA_RE = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g

class ImageWidget extends WidgetType {
  constructor(readonly alt: string, readonly dataUri: string) {
    super()
  }

  eq(other: ImageWidget) {
    return other.dataUri === this.dataUri && other.alt === this.alt
  }

  toDOM() {
    const wrap = document.createElement('span')
    wrap.className = 'cm-image-widget'

    const thumb = document.createElement('img')
    thumb.src = this.dataUri
    thumb.className = 'cm-image-thumb'
    thumb.alt = this.alt || 'image'

    const label = document.createElement('span')
    label.className = 'cm-image-label'
    label.textContent = this.alt || 'image'

    wrap.appendChild(thumb)
    wrap.appendChild(label)
    return wrap
  }

  ignoreEvent() { return false }
}

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const { head, anchor } = view.state.selection.main
  const selFrom = Math.min(head, anchor)
  const selTo = Math.max(head, anchor)

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    IMAGE_DATA_RE.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = IMAGE_DATA_RE.exec(text)) !== null) {
      const start = from + match.index
      const end = start + match[0].length
      // Expand to raw text when cursor/selection overlaps this range
      if (selTo >= start && selFrom <= end) continue
      builder.add(start, end, Decoration.replace({
        widget: new ImageWidget(match[1], match[2])
      }))
    }
  }
  return builder.finish()
}

export const imageWidgetPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (v) => v.decorations }
)
