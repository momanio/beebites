import { fallbackSettings } from '../src/data/fallbackMenu'

export function getDefaultAboutCards() {
  return fallbackSettings.aboutCards.map((card) => ({
    ...card,
    _type: 'aboutCard' as const,
  }))
}

export function getInitialSiteSettings() {
  return { ...fallbackSettings, aboutCards: getDefaultAboutCards() }
}
