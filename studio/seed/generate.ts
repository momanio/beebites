import { writeFileSync } from 'node:fs'
import { fallbackMenu, fallbackSettings } from '../../src/data/fallbackMenu.ts'

const documents = [
  ...fallbackMenu.categories.map((category) => ({
    ...category,
    _type: 'category',
    slug: { _type: 'slug', current: category.slug },
  })),
  ...fallbackMenu.products.map(({ categoryId, ...product }) => ({
    ...product,
    _type: 'product',
    menuCategory: categoryId === 'category-savory' ? 'savory' : 'sweet',
  })),
  {
    ...fallbackSettings,
    _id: 'siteSettings',
    _type: 'siteSettings',
    aboutCards: fallbackSettings.aboutCards.map((card) => ({
      ...card,
      _type: 'aboutCard',
    })),
  },
]

writeFileSync(
  new URL('./menu.ndjson', import.meta.url),
  documents.map((document) => JSON.stringify(document)).join('\n') + '\n',
)
console.log(
  `Generated ${documents.length} seed documents from the local fallback content.`,
)
