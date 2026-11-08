import type { Category } from '../types/menu'

export const menuCategories: Category[] = [
  {
    _id: 'category-new',
    title: 'جديدنا',
    slug: 'new',
    order: 1,
    parentId: null,
  },
  {
    _id: 'category-cells',
    title: 'الخلايا',
    slug: 'cells',
    order: 2,
    parentId: null,
  },
  {
    _id: 'category-sweet',
    title: 'خلايا حلوة',
    slug: 'sweet',
    order: 1,
    parentId: 'category-cells',
  },
  {
    _id: 'category-savory',
    title: 'خلايا مالحه',
    slug: 'savory',
    order: 2,
    parentId: 'category-cells',
  },
]
