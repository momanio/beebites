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
      structure: (S) => {
        const productsInCategory = (categoryId: string) =>
          S.documentTypeList('product')
            .title('منتجات القسم')
            .filter(
              `_type == "product" && (${productCategoryExpression}) == $categoryId`,
            )
            .params({ categoryId: categoryId.replace(/^drafts\./, '') })
            .initialValueTemplates([
              S.initialValueTemplateItem('product-by-category', { categoryId }),
            ])
            .defaultOrdering([{ field: 'order', direction: 'asc' }])

        return S.list()
          .title('بي بايتس')
          .items([
            S.listItem()
              .title('كل المنتجات')
              .child(
                S.documentTypeList('product')
                  .title('كل المنتجات')
                  .defaultOrdering([{ field: 'order', direction: 'asc' }]),
              ),
            S.listItem()
              .title('منتجات الواجهة — Featured / Trend')
              .child(
                S.documentTypeList('product')
                  .title('منتجات الواجهة — اختر خمسة')
                  .filter('_type == "product" && heroHighlight in ["featured", "trend"]')
                  .defaultOrdering([{ field: 'order', direction: 'asc' }]),
              ),
            S.listItem()
              .title('المنتجات حسب الأقسام')
              .child(
                S.documentTypeList('category')
                  .title('الأقسام الرئيسية')
                  .filter('_type == "category" && !defined(parent)')
                  .defaultOrdering([{ field: 'order', direction: 'asc' }])
                  .child((categoryId) =>
                    S.list()
                      .title('منتجات القسم وأقسامه الفرعية')
                      .items([
                        S.listItem()
                          .title('منتجات هذا القسم')
                          .child(productsInCategory(categoryId)),
                        S.listItem()
                          .title('الأقسام الفرعية')
                          .child(
                            S.documentTypeList('category')
                              .title('الأقسام الفرعية')
                              .filter(
                                '_type == "category" && parent._ref == $parentId',
                              )
                              .params({ parentId: categoryId })
                              .defaultOrdering([
                                { field: 'order', direction: 'asc' },
                              ])
                              .child(productsInCategory),
                          ),
                      ]),
                  ),
              ),
            S.listItem()
              .title('نصوص الموقع — عربي / English')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.listItem()
              .title('إدارة الأقسام')
              .child(
                S.documentTypeList('category')
                  .title('إنشاء وتعديل الأقسام')
                  .defaultOrdering([{ field: 'order', direction: 'asc' }]),
              ),
          ])
      },
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => [
      ...templates,
      {
        id: 'product-by-category',
        title: 'منتج في هذا القسم',
        schemaType: 'product',
        parameters: [{ name: 'categoryId', title: 'القسم', type: 'string' }],
        value: ({ categoryId }: { categoryId: string }) => ({
          category: {
            _type: 'reference',
            _ref: categoryId.replace(/^drafts\./, ''),
          },
          available: true,
          comingSoon: false,
          order: 1,
        }),
      },
    ],
  },
})
