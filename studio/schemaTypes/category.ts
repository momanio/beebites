import { defineField, defineType } from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'الأقسام',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'اسم القسم',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'رابط القسم',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'القسم الرئيسي',
      type: 'reference',
      to: [{ type: 'category' }],
      description:
        'اتركه فارغاً لقسم رئيسي مثل جديدنا أو الخلايا. اختر الخلايا لإنشاء قسم فرعي تحته.',
      options: {
        filter: ({ document }) => ({
          filter: '!defined(parent) && !(_id in [$id, $draftId])',
          params: {
            id: document._id.replace(/^drafts\./, ''),
            draftId: `drafts.${document._id.replace(/^drafts\./, '')}`,
          },
        }),
      },
      validation: (rule) =>
        rule.custom(async (value, context) => {
          const reference = value as { _ref?: string } | undefined
          if (!reference?._ref) return true
          const id = context.document?._id.replace(/^drafts\./, '')
          const parentId = reference._ref.replace(/^drafts\./, '')
          if (id === parentId) return 'لا يمكن أن يكون القسم تابعاً لنفسه.'
          const client = context
            .getClient({ apiVersion: '2026-01-01' })
            .withConfig({ perspective: 'raw', useCdn: false })
          const documents = await client.fetch<
            { parent?: { _ref?: string } }[]
          >(
            '*[_type == "category" && _id in [$parentId, $parentDraftId]]{parent}',
            { parentId, parentDraftId: `drafts.${parentId}` },
          )
          if (documents.some((document) => document.parent?._ref))
            return 'اختر قسماً رئيسياً؛ يدعم الموقع قسماً رئيسياً وأقساماً فرعية تحته.'
          const hasChildren = await client.fetch<boolean>(
            'count(*[_type == "category" && parent._ref == $id]) > 0',
            { id },
          )
          return hasChildren
            ? 'هذا القسم يحتوي أقساماً فرعية، لذلك يجب أن يبقى قسماً رئيسياً.'
            : true
        }),
    }),
    defineField({
      name: 'order',
      title: 'ترتيب العرض',
      type: 'number',
      initialValue: 1,
      description: 'الأرقام الأصغر تظهر أولاً.',
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  preview: {
    select: { title: 'title', parentTitle: 'parent.title' },
    prepare({ title, parentTitle }) {
      return {
        title,
        subtitle: parentTitle ? `قسم فرعي من ${parentTitle}` : 'قسم رئيسي',
      }
    },
  },
  orderings: [
    {
      title: 'ترتيب العرض',
      name: 'menuOrder',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
})
