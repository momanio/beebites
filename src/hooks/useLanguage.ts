import { useSyncExternalStore } from 'react'
import { translate, type Language, type MessageKey } from '../lib/i18n'

const storageKey = 'beebites-language'
const listeners = new Set<() => void>()
let observer: MutationObserver | undefined

function getLanguage(): Language {
  return document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'ar'
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  if (!observer) {
    observer = new MutationObserver(() => listeners.forEach((listener) => listener()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  }
  return () => {
    listeners.delete(onChange)
    if (!listeners.size) {
      observer?.disconnect()
      observer = undefined
    }
  }
}

export function setLanguage(language: Language) {
  document.documentElement.lang = language
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  try {
    localStorage.setItem(storageKey, language)
  } catch { /* Language switching also works without storage. */ }
}

export function initializeLanguage() {
  const requested = new URLSearchParams(window.location.search).get('lang')
  let stored: string | null = null
  try { stored = localStorage.getItem(storageKey) } catch { /* Use the default. */ }
  const language = requested === 'en' || requested === 'ar' ? requested : stored
  setLanguage(language === 'en' ? 'en' : 'ar')
}

export function useLanguage() {
  const language = useSyncExternalStore<Language>(subscribe, getLanguage, () => 'ar')
  return {
    language,
    setLanguage,
    t: (key: MessageKey, values?: Record<string, string | number>) => translate(key, language, values),
  }
}
