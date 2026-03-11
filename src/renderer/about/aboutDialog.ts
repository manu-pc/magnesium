import { t } from '../../shared/i18n'
import mgIconUrl from '../assets/icon.png'

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'

declare const __APP_VERSION__: string

export function openAboutDialog(): void {
  if (document.getElementById('about-overlay')) return

  const overlay = document.createElement('div')
  overlay.id = 'about-overlay'
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    z-index: 1000; display: flex; align-items: center; justify-content: center;
  `

  const dialog = document.createElement('div')
  dialog.style.cssText = `
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 12px; padding: 32px 40px; max-width: 420px; width: 90%;
    text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    color: var(--text-primary); font-family: system-ui, sans-serif;
  `

  dialog.innerHTML = `
    <div style="margin-bottom:16px;"><img src="${mgIconUrl}" width="80" height="80" style="border-radius:16px;" alt="Magnesium" /></div>
    <h2 style="font-size:24px;font-weight:700;margin-bottom:4px;color:var(--text-primary);">Magnesium</h2>
    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">v${APP_VERSION}</div>
    <p style="font-size:14px;line-height:1.6;color:var(--text-primary);margin-bottom:20px;">${t('about.description')}</p>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;text-align:left;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-color);">
        <span style="font-weight:500;">${t('about.repository')}</span>
        <a id="about-repo-link" href="#" style="color:var(--accent-color);text-decoration:none;">github.com/manu-pc/magnesium</a>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-color);">
        <span style="font-weight:500;">${t('about.license')}</span>
        <span>MIT</span>
      </div>
      <div style="padding:6px 0;">
        <span style="font-weight:500;">${t('about.builtWith')}</span>
        <span style="display:block;margin-top:2px;line-height:1.8;">
          Electron · TypeScript · CodeMirror 6 · unified/remark/rehype
        </span>
      </div>
    </div>
    <button id="about-close-btn" style="
      margin-top:20px; padding:8px 32px;
      background:var(--accent-color); color:#fff; border:none;
      border-radius:6px; font-size:14px; cursor:pointer; font-weight:500;
    ">${t('about.close')}</button>
  `

  overlay.appendChild(dialog)
  document.body.appendChild(overlay)

  dialog.querySelector('#about-repo-link')?.addEventListener('click', (e) => {
    e.preventDefault()
    window.electronAPI.openExternal('https://github.com/manu-pc/magnesium')
  })

  const close = () => overlay.remove()
  document.getElementById('about-close-btn')?.addEventListener('click', close)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey) }
  })
}
