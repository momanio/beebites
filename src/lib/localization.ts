import { fallbackSettings } from '../data/fallbackMenu.ts'
import type { MenuData, SiteSettings } from '../types/menu'
import type { Language } from './i18n.ts'

const englishContent: Record<string, string> = {
  'جديدنا': 'New arrivals',
  'الخلايا': 'Honeycomb breads',
  'خلايا حلوة': 'Sweet honeycomb',
  'خلايا مالحه': 'Savoury honeycomb',
  'خلايا مالحة': 'Savoury honeycomb',
  'المرطبات': 'Drinks',
  'مرطبات ساخن': 'Hot drinks',
  'مرطبات بارد': 'Cold drinks',
  'المربيات': 'Jams',
  'خلية شوكليت مكس': 'Mixed Chocolate Honeycomb',
  'خلية شوكليت': 'Chocolate Honeycomb',
  'خلية سينابون': 'Cinnamon Honeycomb',
  'خليه سينابون': 'Cinnamon Honeycomb',
  'سينابون': 'Cinnamon Rolls',
  'كلاسيك مع عسل': 'Classic Honeycomb with Honey',
  'كلاسيك مع قطر': 'Classic Honeycomb with Syrup',
  'خلية كلاسيك مع قطر': 'Classic Honeycomb with Syrup',
  'خليه كلاسيك مع قطر': 'Classic Honeycomb with Syrup',
  'كلاسيك محلاه بالقطر': 'Classic, sweetened with syrup',
  'عجينه هشة زي الغيم محشية جنبه كريمي و محلاه بالقطر 👌': 'Cloud-soft dough filled with cream cheese and sweetened with syrup 👌',
  'خلية حليب محموس': 'Toasted Milk Honeycomb',
  'خلية لوتس': 'Lotus Honeycomb',
  'خلية سينامون كراميل': 'Cinnamon Caramel Honeycomb',
  'خلية كراميل': 'Caramel Honeycomb',
  'خلية بالكاراميل': 'Caramel Honeycomb',
  'فيتا و زعتر مع قطر او بدون': 'Feta & Za’atar, with or without Syrup',
  'فيتا و زعتر مع عسل': 'Feta & Za’atar with Honey',
  'خلية طحين الحبه الكاملة': 'Whole Wheat Honeycomb',
  '(وايت & عادي)': '(White & milk chocolate)',
  '(وايت شوكليت و قرفة)': '(White chocolate & cinnamon)',
  '(كراميل و قرفة)': '(Caramel & cinnamon)',
  '(اي نوع)': '(Any filling)',
  'قريباً': 'Coming soon',
  'حشوة لوتس': 'Lotus filling',
  'جديد': 'New',
}

function englishText(original: string | null | undefined, translated?: string | null) {
  return translated?.trim() || (original ? englishContent[original.trim()] || original : original)
}

export function localizeMenu(menu: MenuData, language: Language): MenuData {
  if (language === 'ar') return menu
  const categories = menu.categories.map((category) => ({
    ...category,
    title: englishText(category.title, category.titleEn) || category.title,
  }))
  const titles = new Map(categories.map((category) => [category._id, category.title]))
  return {
    categories,
    products: menu.products.map((product) => ({
      ...product,
      name: englishText(product.name, product.nameEn) || product.name,
      subtitle: englishText(product.subtitle, product.subtitleEn),
      description: englishText(product.description, product.descriptionEn),
      badge: englishText(product.badge, product.badgeEn),
      categoryTitle: titles.get(product.categoryId) || englishText(product.categoryTitle),
    })),
  }
}

const settingDefaults = {
  defaultWhatsappMessage: 'Hi BeeBites! I’d like to place an order 🐝',
  heroSlogan: 'Irresistibly soft. Unforgettably good.',
  heroSubline: 'Special flavours, carefully chosen ingredients.',
  highlightTitle: 'Every honeycomb is soft and fluffy as a cloud',
  highlightText: 'Filled with premium cream cheese, with Lotus or chocolate fillings available too.',
  orderNote: 'Every honeycomb is baked fresh to order. Please order a day ahead; we’ll confirm the time and details on WhatsApp.',
}

export function localizeSettings(settings: SiteSettings, language: Language): SiteSettings {
  if (language === 'ar') return settings
  const result = { ...settings }
  for (const key of Object.keys(settingDefaults) as (keyof typeof settingDefaults)[]) {
    result[key] = settings[`${key}En`]?.trim() ||
      (settings[key] === fallbackSettings[key] ? settingDefaults[key] : settings[key])
  }
  result.announcement = {
    ...settings.announcement,
    text: settings.announcement.textEn?.trim() || settings.announcement.text,
  }
  return result
}
