# Magnesium

A Markdown editor with live preview and customizable styles for Linux.

[Galician version / Versión en galego](README.gl.md)

![Magnesium screenshot](resources/screenshot.png)

---

## Features

- **Live preview** — side-by-side editor and rendered Markdown, updated as you type
- **Customisable styles** — control fonts, sizes, colors, spacing, and backgrounds for every Markdown element
- **Style presets** — built-in presets (Default, GitHub, Dracula, Solarized Light); save, load, import, and export your own
- **Custom format rules** — define char-replace substitutions, line-prefix styles, inline regex highlights, and custom list-marker formatting
- **Dark mode** — purely cosmetic dark editing environment; exports are always in light mode
- **PDF export** — export the current document as a styled PDF
- **Extended list markers** — support for `>`, `~`, `:`, `!`, `?`, `#`, `@`, `$`, `%`, `&`, `=`, `^`, `|`, `\` as unordered markers, and `ordered:.`, `ordered:)`, `ordered:alpha` for ordered lists
- **Syntax highlighting** — code blocks highlighted via highlight.js with GitHub and GitHub Dark themes
- **Internationalisation** — English and Galician interface, switchable in settings
- **Keyboard shortcuts** — `Ctrl+N`, `Ctrl+O`, `Ctrl+S`, `Ctrl+Shift+S`, `Ctrl+,`, `Ctrl+Shift+E`, `Ctrl+Shift+D`

---

## Built with

- [Electron](https://www.electronjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [CodeMirror 6](https://codemirror.net/)
- [unified](https://unifiedjs.com/) / [remark](https://remark.js.org/) / [rehype](https://rehype.js.org/)

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Package as distributable

```bash
npm run dist
```

Linux targets: AppImage and .deb (configured in `package.json` under `"build"`).

---

## Keyboard shortcuts

| Action | Shortcut |
|---|---|
| New file | `Ctrl+N` |
| Open file | `Ctrl+O` |
| Save | `Ctrl+S` |
| Save as | `Ctrl+Shift+S` |
| Export PDF | `Ctrl+Shift+E` |
| Toggle dark mode | `Ctrl+Shift+D` |
| Settings | `Ctrl+,` |

---

## Custom format rules

Rules are defined in the Settings panel under **Custom Rules**.

| Type | Description |
|---|---|
| `char-replace` | Replace a literal string with another (e.g. `(c)` → `©`). Scope options: outside code, inline only, all. |
| `line-prefix` | Apply a style to paragraphs starting with a given prefix. |
| `inline-regex` | Apply a style to text matching a JavaScript regex. |
| `list-marker` | Apply a style (and optional custom marker symbol) to list items using a specific marker character. |

---

## License

[MIT](LICENSE)
