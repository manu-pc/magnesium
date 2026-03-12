import { ipcMain, BrowserWindow, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { IPC, PdfExportConfig, DEFAULT_PDF_EXPORT } from '../shared/types'

// Remove or neutralise all href attributes so the PDF renderer does not try to
// resolve file:// paths from /tmp, which produces broken-link errors.
function sanitiseLinksForPdf(html: string): string {
  // Replace http/https hrefs with a data attribute (PDF can't open them anyway)
  return html
    .replace(/href="(https?:\/\/[^"]+)"/g, 'data-href="$1" href="#"')
    .replace(/href="(?!#)[^"]*"/g, 'href="#"')
}

async function safeDestroyWindow(win: BrowserWindow): Promise<void> {
  try {
    win.webContents.session.clearCache()
    await new Promise((resolve) => setTimeout(resolve, 150))
    win.removeAllListeners()
    win.webContents.removeAllListeners()
    if (!win.isDestroyed()) win.destroy()
  } catch {
    // ignore cleanup errors
  }
}

export function registerPdfHandler(win: BrowserWindow): void {
  ipcMain.handle(IPC.EXPORT_PDF, async (_event, { htmlContent, pdfConfig }: { htmlContent: string; pdfConfig?: PdfExportConfig }) => {
    const config: PdfExportConfig = pdfConfig ?? DEFAULT_PDF_EXPORT
    const safeHtml = sanitiseLinksForPdf(htmlContent)
    const tmpFile = path.join(os.tmpdir(), `mg-export-${Date.now()}.html`)
    fs.writeFileSync(tmpFile, safeHtml, 'utf-8')

    const pdfWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    })

    try {
      await pdfWin.loadURL(`file://${tmpFile}`)
      await new Promise((resolve) => setTimeout(resolve, 500))

      let pdfBuffer: Buffer

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pdfBuffer = await (pdfWin.webContents as any).printToPDF({
          pageSize: config.pageSize,
          printBackground: config.printBackground,
          margins: {
            marginType: 'custom',
            top: config.margins.top,
            bottom: config.margins.bottom,
            left: config.margins.left,
            right: config.margins.right
          }
        })
      } catch {
        // fallback: default margins
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pdfBuffer = await (pdfWin.webContents as any).printToPDF({
          pageSize: config.pageSize,
          printBackground: config.printBackground,
          margins: { marginType: 'default' }
        })
      }

      const saveResult = await dialog.showSaveDialog(win, {
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: 'document.pdf'
      })

      if (saveResult.canceled || !saveResult.filePath) {
        return { error: 'Cancelled' }
      }

      fs.writeFileSync(saveResult.filePath, pdfBuffer)
      return { filePath: saveResult.filePath }
    } catch (err) {
      console.error('[PDF] Error:', err)
      return { error: String(err) }
    } finally {
      await safeDestroyWindow(pdfWin)
      try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }
    }
  })
}
