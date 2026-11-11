export interface SanityImage {
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
  hotspot?: { x: number; y: number; width: number; height: number }
  crop?: { top: number; bottom: number; left: number; right: number }
}

export interface Product {
  _id: string
  name: string
  subtitle?: string | null
  categoryId: string
  categoryTitle?: string | null
  price: number
  image?: SanityImage | null
  description?: string | null
  badge?: string | null
  heroHighlight?: 'none' | 'featured' | 'trend' | null
  comingSoon: boolean
  available: boolean
  order: number
}

export interface Category {
  _id: string
  title: string
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
  heroSlogan: string
  heroSubline: string
  highlightTitle: string
  highlightText: string
  orderNote: string
  instagramUrl: string
  facebookUrl: string
  announcement: { enabled: boolean; text: string }
  aboutCards: AboutCard[]
  logo?: SanityImage | null
}

export interface CartLine {
  product: Product
  quantity: number
  lineTotal: number
}
