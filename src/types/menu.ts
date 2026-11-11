export interface SanityImage {
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
  hotspot?: { x: number; y: number; width: number; height: number }
  crop?: { top: number; bottom: number; left: number; right: number }
}

export interface Product {
  _id: string
  name: string
  nameEn?: string | null
  subtitle?: string | null
  subtitleEn?: string | null
  categoryId: string
  categoryTitle?: string | null
  price: number
  image?: SanityImage | null
  description?: string | null
  descriptionEn?: string | null
  badge?: string | null
  badgeEn?: string | null
  heroHighlight?: 'none' | 'featured' | 'trend' | null
  comingSoon: boolean
  available: boolean
  order: number
}

export interface Category {
  _id: string
  title: string
  titleEn?: string | null
  slug: string
  order: number
  parentId?: string | null
}

export interface MenuData {
  categories: Category[]
  products: Product[]
}

export interface AboutCard {
  _key: string
  title: string
  text: string
}

export interface SiteSettings {
  whatsappNumber: string
  defaultWhatsappMessage: string
  defaultWhatsappMessageEn?: string | null
  heroSlogan: string
  heroSloganEn?: string | null
  heroSubline: string
  heroSublineEn?: string | null
  highlightTitle: string
  highlightTitleEn?: string | null
  highlightText: string
  highlightTextEn?: string | null
  orderNote: string
  orderNoteEn?: string | null
  instagramUrl: string
  facebookUrl: string
  announcement: { enabled: boolean; text: string; textEn?: string | null }
  aboutCards: AboutCard[]
  logo?: SanityImage | null
}

export interface CartLine {
  product: Product
  quantity: number
  lineTotal: number
}
