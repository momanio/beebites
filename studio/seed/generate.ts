import { writeFileSync } from 'node:fs'
import { fallbackMenu, fallbackSettings } from '../../src/data/fallbackMenu.ts'

const documents = [
  ...fallbackMenu.categories.map(({ parentId, ...category }) => ({
    ...category,
    _type: 'category',
    slug: { _type: 'slug', current: category.slug },
    ...(parentId ? { parent: { _type: 'reference', _ref: parentId } } : {}),
  })),
  ...fallbackMenu.products.map(({ categoryId, ...product }) => ({
    ...product,
    _type: 'product',
    category: { _type: 'reference', _ref: categoryId },
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
