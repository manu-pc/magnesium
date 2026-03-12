import { en } from './locales/en'
import { gl } from './locales/gl'

export type Lang = 'en' | 'gl'

const locales: Record<Lang, Record<string, string>> = { en, gl }

let currentLang: Lang = 'en'

export function setLanguage(lang: Lang): void {
  currentLang = lang
}

export function getLanguage(): Lang {
  return currentLang
}

export function t(key: string, vars?: Record<string, string>): string {
  const locale = locales[currentLang] ?? locales['en']
  let str = locale[key] ?? locales['en'][key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v)
    }
  }
  return str
}
