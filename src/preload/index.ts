import { contextBridge, ipcRenderer } from 'electron'
import { IPC, AppConfig, PdfExportConfig, MarkdownStyles, CustomFormatRule } from '../shared/types'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filePath: string) => ipcRenderer.invoke(IPC.FILE_OPEN, filePath),
  saveFile: (filePath: string, content: string) => ipcRenderer.invoke(IPC.FILE_SAVE, filePath, content),
  saveFileAs: (content: string) => ipcRenderer.invoke(IPC.FILE_SAVE_AS, content),
  exportPdf: (htmlContent: string, pdfConfig: PdfExportConfig) => ipcRenderer.invoke(IPC.EXPORT_PDF, { htmlContent, pdfConfig }),
  getConfig: () => ipcRenderer.invoke(IPC.CONFIG_GET),
  setConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => ipcRenderer.invoke(IPC.CONFIG_SET, key, value),
  showOpenDialog: () => ipcRenderer.invoke(IPC.SHOW_OPEN_DIALOG),
  showSaveDialog: () => ipcRenderer.invoke(IPC.SHOW_SAVE_DIALOG),
  exportStyle: (markdownStyles: MarkdownStyles, customRules: CustomFormatRule[], name: string) =>
    ipcRenderer.invoke(IPC.STYLE_EXPORT, { markdownStyles, customRules, name }),
  importStyle: () => ipcRenderer.invoke(IPC.STYLE_IMPORT),
  stylesList: () => ipcRenderer.invoke(IPC.STYLES_LIST),
  stylesSaveNew: (style: { name: string; markdownStyles: MarkdownStyles; customRules: CustomFormatRule[] }) =>
    ipcRenderer.invoke(IPC.STYLES_SAVE_NEW, style),
  stylesDelete: (filename: string) => ipcRenderer.invoke(IPC.STYLES_DELETE, filename),
  stylesRename: (filename: string, newName: string) => ipcRenderer.invoke(IPC.STYLES_RENAME, { filename, newName }),
  stylesUpdate: (filename: string, markdownStyles: MarkdownStyles, customRules: CustomFormatRule[]) => ipcRenderer.invoke(IPC.STYLES_UPDATE, { filename, markdownStyles, customRules }),
  openExternal: (url: string) => ipcRenderer.invoke(IPC.SHELL_OPEN_EXTERNAL, url),
  menuRebuild: (lang: string) => ipcRenderer.invoke(IPC.MENU_REBUILD, lang),
  showCloseDialog: () => ipcRenderer.invoke(IPC.SHOW_CLOSE_DIALOG),
  showDiscardDialog: () => ipcRenderer.invoke(IPC.SHOW_DISCARD_DIALOG),

  onFileLoaded: (callback: (data: { content: string; filePath: string }) => void) => {
    const wrapper = (_event: Electron.IpcRendererEvent, data: { content: string; filePath: string }) => callback(data)
    ipcRenderer.on(IPC.FILE_LOADED, wrapper)
    return wrapper
  },
  offFileLoaded: (wrapper: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(IPC.FILE_LOADED, wrapper)
  },

  onWindowBeforeClose: (callback: () => void) => {
    const wrapper = () => callback()
    ipcRenderer.on(IPC.WINDOW_BEFORE_CLOSE, wrapper)
    return wrapper
  },
  offWindowBeforeClose: (wrapper: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(IPC.WINDOW_BEFORE_CLOSE, wrapper)
  },

  onConfigChanged: (callback: (config: AppConfig) => void) => {
    const wrapper = (_event: Electron.IpcRendererEvent, config: AppConfig) => callback(config)
    ipcRenderer.on(IPC.CONFIG_CHANGED, wrapper)
    return wrapper
  },
  offConfigChanged: (wrapper: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(IPC.CONFIG_CHANGED, wrapper)
  },

  onMenuEvent: (event: string, callback: () => void) => {
    const wrapper = () => callback()
    ipcRenderer.on(event, wrapper)
    return wrapper
  },
  offMenuEvent: (event: string, wrapper: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(event, wrapper)
  },

  confirmClose: () => ipcRenderer.send(IPC.WINDOW_CLOSE_CONFIRMED),
  cancelClose: () => ipcRenderer.send(IPC.WINDOW_CLOSE_CANCELLED),
  pickImage: () => ipcRenderer.invoke(IPC.IMAGE_PICK)
})
