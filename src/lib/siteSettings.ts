import { fallbackSettings } from '../data/fallbackMenu.ts'
import type { SiteSettings } from '../types/menu'

export type SettingsResponse = {
  [K in keyof SiteSettings]?: SiteSettings[K] | null
}

export function validateWhatsappNumber(
  value: string | undefined,
): true | string {
  if (!value?.trim() || value === fallbackSettings.whatsappNumber) return true
  return /^[1-9]\d{7,14}$/.test(value)
    ? true
    : 'أدخل رقم واتساب الدولي بالأرقام فقط، بدون + أو مسافات.'
}

export function whatsappSetupWarning(value: string | undefined): true | string {
  return !value?.trim() || value === fallbackSettings.whatsappNumber
    ? 'الطلب عبر واتساب متوقف حتى إضافة رقم حقيقي. يمكنك نشر باقي إعدادات الموقع الآن.'
    : true
}

export function resolveSiteSettings(
  data: SettingsResponse | null,
): SiteSettings {
  if (!data) return fallbackSettings
  const definedFields = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value != null),
  )
  return {
    ...fallbackSettings,
    ...definedFields,
    heroSlogan: data.heroSlogan?.trim() || fallbackSettings.heroSlogan,
    defaultWhatsappMessage:
      data.defaultWhatsappMessage?.trim() ||
      fallbackSettings.defaultWhatsappMessage,
    aboutCards: fallbackSettings.aboutCards,
  }
}
