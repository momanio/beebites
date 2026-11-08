import { menuCategories } from '../../src/data/menuCategories.ts'

export interface MigrationDocument {
  _id: string
  _type: string
  _rev: string
  title?: string
  slug?: { _type?: string; current?: string }
  order?: number
  parent?: { _ref: string }
  category?: { _ref: string }
  menuCategory?: string
}

export interface CategoryDocument {
  _id: string
  _type: 'category'
  title: string
  slug: { _type: 'slug'; current: string }
  order: number
  parent?: { _type: 'reference'; _ref: string }
}

export interface DocumentUpdate {
  id: string
  revision: string
  set: Record<string, unknown>
  unset: string[]
}

const legacyTitles: Record<string, string[]> = {
  'category-new': ['جديدنا'],
  'category-cells': ['الخلايا'],
  'category-sweet': ['حلو', 'الحلو', 'خلايا حلوة'],
  'category-savory': ['مالح', 'المالح', 'خلايا مالحه', 'خلايا مالحة'],
}

export function buildCategoryMigration(documents: MigrationDocument[]) {
  const categories = documents.filter(
    (document) => document._type === 'category',
  )
  const published = categories.filter(
    (document) =>
      !document._id.startsWith('drafts.') &&
      !document._id.startsWith('versions.'),
  )
  const ids = new Map<string, string>()
  for (const category of menuCategories) {
    const existing =
      published.find((document) => document._id === category._id) ??
      published.find((document) => document.slug?.current === category.slug) ??
      published.find((document) =>
        legacyTitles[category._id].includes(document.title ?? ''),
      )
    ids.set(category._id, existing?._id ?? category._id)
  }

  const creates: CategoryDocument[] = []
  const updates: DocumentUpdate[] = []
  for (const category of menuCategories) {
    const id = ids.get(category._id)!
    const parentId = category.parentId ? ids.get(category.parentId) : undefined
    if (!published.some((document) => document._id === id)) {
      creates.push({
        _id: id,
        _type: 'category',
        title: category.title,
        slug: { _type: 'slug', current: category.slug },
        order: category.order,
        ...(parentId ? { parent: { _type: 'reference', _ref: parentId } } : {}),
      })
    }
    for (const document of categories.filter(
      (item) => item._id === id || item._id === `drafts.${id}`,
    )) {
      const set: Record<string, unknown> = {}
      const unset: string[] = []
      if (
        !document.title ||
        (legacyTitles[category._id].includes(document.title) &&
          document.title !== category.title)
      )
        set.title = category.title
      if (
        !document.slug?.current ||
        (legacyTitles[category._id].includes(document.title ?? '') &&
          document.slug.current !== category.slug)
      )
        set.slug = { _type: 'slug', current: category.slug }
      if (!Number.isFinite(document.order)) set.order = category.order
      if (parentId && document.parent?._ref !== parentId)
        set.parent = { _type: 'reference', _ref: parentId }
      if (!parentId && document.parent) unset.push('parent')
      if (Object.keys(set).length || unset.length)
        updates.push({ id: document._id, revision: document._rev, set, unset })
    }
  }

  const categoryIds = new Set([
    ...categories.map((document) => document._id.replace(/^drafts\./, '')),
    ...ids.values(),
  ])
  for (const document of documents.filter(
    (item) => item._type === 'product' && !item._id.startsWith('versions.'),
  )) {
    const reference = document.category?._ref
    const mapped = reference ? (ids.get(reference) ?? reference) : undefined
    const target =
      mapped && categoryIds.has(mapped)
        ? mapped
        : ids.get(
            document.menuCategory === 'savory'
              ? 'category-savory'
              : 'category-sweet',
          )!
    const set: Record<string, unknown> =
      reference === target
        ? {}
        : { category: { _type: 'reference', _ref: target } }
    const unset = document.menuCategory === undefined ? [] : ['menuCategory']
    if (Object.keys(set).length || unset.length)
      updates.push({ id: document._id, revision: document._rev, set, unset })
  }
  return { creates, updates, categoryIds: Object.fromEntries(ids) }
}
