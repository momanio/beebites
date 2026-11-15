import { useEffect, useState } from 'react'
import { Button, Card, Flex, Select, Stack, Text } from '@sanity/ui'
import { set, useClient, useFormValue, type ArrayOfPrimitivesInputProps } from 'sanity'

interface CategoryReference {
  _key: string
  _type: 'reference'
  _ref: string
}

interface CategoryOption {
  _id: string
  title: string
  parentTitle?: string | null
}

const clientOptions = { apiVersion: '2026-01-01' }
const categoriesQuery = `*[_type == "category" && !(_id in path("drafts.**"))]
  | order(order asc, title asc) {
    _id, title, "parentTitle": parent->title
  }`

function categoryLabel(category: CategoryOption): string {
  return category.parentTitle
    ? `${category.parentTitle} / ${category.title}`
    : category.title
}

export function AdditionalCategoriesInput(props: ArrayOfPrimitivesInputProps) {
  const client = useClient(clientOptions)
  const primaryCategory = useFormValue(['category']) as { _ref?: string } | undefined
  const [categories, setCategories] = useState<CategoryOption[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    client.fetch<CategoryOption[]>(categoriesQuery, {}, { perspective: 'published' })
      .then((result) => {
        if (active) setCategories(result)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => { active = false }
  }, [client, refreshKey])

  // Sanity types reference arrays as primitive inputs, but their values are keyed references.
  const selected = (props.value ?? []) as unknown as CategoryReference[]
  const selectedIds = new Set(selected.map((reference) => reference._ref))
  const available = categories?.filter(
    (category) => category._id !== primaryCategory?._ref && !selectedIds.has(category._id),
  ) ?? []
  const categoryNames = new Map(categories?.map((category) => [category._id, categoryLabel(category)]))

  function addCategory(id: string) {
    if (!id || id === primaryCategory?._ref || selectedIds.has(id)) return
    props.onChange(set([
      ...selected,
      { _key: crypto.randomUUID(), _type: 'reference', _ref: id },
    ]))
  }

  function removeCategory(key: string) {
    props.onChange(set(selected.filter((reference) => reference._key !== key)))
  }

  return (
    <Stack space={3}>
      <Select
        aria-label="اختر قسماً إضافياً موجوداً"
        value=""
        disabled={props.readOnly || loadError || available.length === 0}
        onChange={(event) => addCategory(event.currentTarget.value)}
      >
        <option value="">
          {categories === null && !loadError
            ? 'جارٍ تحميل الأقسام…'
            : available.length === 0 ? 'لا توجد أقسام أخرى للاختيار' : 'اختر قسماً موجوداً…'}
        </option>
        {available.map((category) => (
          <option key={category._id} value={category._id}>
            {categoryLabel(category)}
          </option>
        ))}
      </Select>
      {loadError && (
        <Flex align="center" gap={3}>
          <Text size={1}>تعذر تحميل الأقسام.</Text>
          <Button
            text="إعادة المحاولة"
            mode="ghost"
            disabled={props.readOnly}
            onClick={() => {
              setLoadError(false)
              setCategories(null)
              setRefreshKey((previous) => previous + 1)
            }}
          />
        </Flex>
      )}
      {selected.map((reference) => (
        <Card key={reference._key} padding={3} radius={2} border>
          <Flex align="center" justify="space-between" gap={3}>
            <Text size={1}>{categoryNames.get(reference._ref) ?? reference._ref}</Text>
            <Button
              text="إزالة"
              aria-label={`إزالة ${categoryNames.get(reference._ref) ?? reference._ref} من الأقسام الإضافية`}
              mode="ghost"
              disabled={props.readOnly}
              onClick={() => removeCategory(reference._key)}
            />
          </Flex>
        </Card>
      ))}
    </Stack>
  )
}
