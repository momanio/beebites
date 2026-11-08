import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemaTypes'
import { productCategoryExpression } from '../src/lib/queries'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId)
  throw new Error(
    'Set SANITY_STUDIO_PROJECT_ID in studio/.env before starting Studio. See README.md.',
  )

export default defineConfig({
  name: 'beebites',
  title: 'BeeBites · بي بايتس',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('بي بايتس')
          .items([
            S.listItem()
              .title('حلو')
              .id('sweet-products')
              .child(
                S.documentTypeList('product')
                  .title('حلو')
                  .filter(`_type == "product" && (${productCategoryExpression}) == $categoryId`)
                  .params({ categoryId: 'category-sweet' })
                  .initialValueTemplates([S.initialValueTemplateItem('product-sweet')])
                  .defaultOrdering([{ field: 'order', direction: 'asc' }]),
              ),
            S.listItem()
              .title('مالح')
              .id('savory-products')
              .child(
                S.documentTypeList('product')
                  .title('مالح')
                  .filter(`_type == "product" && (${productCategoryExpression}) == $categoryId`)
                  .params({ categoryId: 'category-savory' })
                  .initialValueTemplates([S.initialValueTemplateItem('product-savory')])
                  .defaultOrdering([{ field: 'order', direction: 'asc' }]),
              ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: [
      {
        id: 'product-sweet',
        title: 'منتج حلو',
        schemaType: 'product',
        value: {
          menuCategory: 'sweet',
          available: true,
          comingSoon: false,
          order: 1,
        },
      },
      {
        id: 'product-savory',
        title: 'منتج مالح',
        schemaType: 'product',
        value: {
          menuCategory: 'savory',
          available: true,
          comingSoon: false,
          order: 1,
        },
      },
    ],
  },
})
