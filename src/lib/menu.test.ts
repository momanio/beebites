import assert from 'node:assert/strict'
import test from 'node:test'
import { fallbackMenu } from '../data/fallbackMenu.ts'
import { resolveMenu, rootCategories } from './menu.ts'
import {
  buildCategoryMigration,
  type MigrationDocument,
} from '../../studio/migrations/categoryHierarchy.ts'

test('storefront reads arbitrary categories and keeps subcategories under their parent', () => {
  const categories = [
    ...fallbackMenu.categories,
    { _id: 'custom', title: 'كيك', slug: 'cakes', order: 3 },
    {
      _id: 'custom-child',
      title: 'كيك الشوكليت',
      slug: 'chocolate-cakes',
      order: 1,
      parentId: 'custom',
    },
  ]
  const menu = resolveMenu({
    categories,
    products: [{ ...fallbackMenu.products[0], categoryId: 'custom-child' }],
  })
  assert.deepEqual(
    rootCategories(menu.categories).map((category) => category.title),
    ['جديدنا', 'الخلايا', 'كيك'],
  )
  assert.equal(menu.products[0].categoryId, 'custom-child')
  assert.equal(menu.products[0].categoryTitle, 'كيك الشوكليت')
  assert.equal(
    menu.categories.find((category) => category._id === 'custom-child')
      ?.parentId,
    'custom',
  )
})

test('جديدنا stays first regardless of display order, including reused category IDs', () => {
  for (const identity of [
    { _id: 'category-new', slug: 'renamed-new' },
    { _id: 'existing-new-arrivals', slug: 'new' },
  ]) {
    const menu = resolveMenu({
      categories: [
        {
          _id: 'refreshments',
          title: 'المرطبات',
          slug: 'refreshments',
          order: 0,
        },
        ...fallbackMenu.categories.map((category) =>
          category._id === 'category-new'
            ? { ...category, ...identity, order: 99 }
            : category,
        ),
      ],
      products: [],
    })
    assert.deepEqual(
      rootCategories(menu.categories).map((category) => category.title),
      ['جديدنا', 'المرطبات', 'الخلايا'],
    )
  }
})

test('المرطبات appears after existing main categories when assigned the last display order', () => {
  const menu = resolveMenu({
    categories: [
      { _id: 'refreshments', title: 'المرطبات', slug: 'refreshments', order: 3 },
      ...fallbackMenu.categories,
    ],
    products: [],
  })
  assert.deepEqual(
    rootCategories(menu.categories).map((category) => category.title),
    ['جديدنا', 'الخلايا', 'المرطبات'],
  )
})

test('legacy products get only the missing categories they still need', () => {
  const menu = resolveMenu({
    categories: [],
    products: [fallbackMenu.products[0]],
  })
  assert.deepEqual(
    new Set(menu.categories.map((category) => category._id)),
    new Set(['category-cells', 'category-sweet']),
  )
  assert.equal(menu.products[0].categoryTitle, 'خلايا حلوة')
  assert.deepEqual(resolveMenu({ categories: [], products: [] }), {
    categories: [],
    products: [],
  })
})

test('unavailable products and invalid prices are omitted, while free products remain', () => {
  const product = fallbackMenu.products[0]
  const menu = resolveMenu({
    categories: fallbackMenu.categories,
    products: [
      { ...product, _id: 'hidden', available: false },
      { ...product, _id: 'invalid', price: Number.NaN },
      { ...product, _id: 'negative', price: -1 },
      { ...product, _id: 'free', price: 0 },
    ],
  })
  assert.deepEqual(
    menu.products.map((item) => item._id),
    ['free'],
  )
})

test('a category whose parent is missing still appears as a root', () => {
  const category = {
    _id: 'orphan',
    title: 'كيك',
    slug: 'cakes',
    order: 1,
    parentId: 'missing',
  }
  assert.deepEqual(rootCategories([category]), [category])
})

test('migration reuses existing category IDs and preserves product details and drafts', () => {
  const documents: MigrationDocument[] = [
    {
      _id: 'old-savory',
      _rev: 'c1',
      _type: 'category',
      title: 'مالح',
      slug: { current: 'malh' },
      order: 1,
    },
    {
      _id: 'cake',
      _rev: 'c2',
      _type: 'category',
      title: 'كيك',
      slug: { current: 'cakes' },
      order: 3,
    },
    {
      _id: 'sweet-product',
      _rev: 'p1',
      _type: 'product',
      menuCategory: 'sweet',
    },
    {
      _id: 'savory-product',
      _rev: 'p2',
      _type: 'product',
      category: { _ref: 'old-savory' },
    },
    {
      _id: 'drafts.savory-product',
      _rev: 'p3',
      _type: 'product',
      menuCategory: 'savory',
    },
    {
      _id: 'custom-product',
      _rev: 'p4',
      _type: 'product',
      category: { _ref: 'cake' },
      menuCategory: 'sweet',
    },
  ]
  const before = structuredClone(documents)
  const plan = buildCategoryMigration(documents)
  assert.equal(plan.categoryIds['category-savory'], 'old-savory')
  assert.deepEqual(
    plan.creates.map((category) => category._id),
    ['category-new', 'category-cells', 'category-sweet'],
  )
  assert.equal(
    plan.updates.find((update) => update.id === 'old-savory')?.set.title,
    'خلايا مالحه',
  )
  assert.deepEqual(
    plan.updates.find((update) => update.id === 'old-savory')?.set.slug,
    { _type: 'slug', current: 'savory' },
  )
  assert.deepEqual(
    plan.updates.find((update) => update.id === 'old-savory')?.set.parent,
    { _type: 'reference', _ref: 'category-cells' },
  )
  assert.equal(
    plan.updates.some((update) => update.id === 'savory-product'),
    false,
  )
  assert.deepEqual(
    plan.updates.find((update) => update.id === 'drafts.savory-product')?.set
      .category,
    { _type: 'reference', _ref: 'old-savory' },
  )
  assert.deepEqual(
    plan.updates.find((update) => update.id === 'custom-product')?.set,
    {},
  )
  assert.deepEqual(
    plan.updates.find((update) => update.id === 'custom-product')?.unset,
    ['menuCategory'],
  )
  for (const update of plan.updates) {
    assert.equal(
      update.revision,
      documents.find((document) => document._id === update.id)?._rev,
    )
    assert.ok(
      Object.keys(update.set).every((key) =>
        ['title', 'slug', 'order', 'parent', 'category'].includes(key),
      ),
    )
  }
  assert.deepEqual(documents, before)

  const migrated = [
    ...documents.map((document) => {
      const update = plan.updates.find((item) => item.id === document._id)
      const next = { ...document, ...update?.set } as MigrationDocument
      for (const field of update?.unset ?? [])
        delete next[field as keyof MigrationDocument]
      return next
    }),
    ...plan.creates.map((category) => ({ ...category, _rev: 'new' })),
  ]
  const repeated = buildCategoryMigration(migrated)
  assert.deepEqual(repeated.creates, [])
  assert.deepEqual(repeated.updates, [])
})
