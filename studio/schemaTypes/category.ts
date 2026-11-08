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
      name: 'order',
      title: 'ترتيب العرض',
      type: 'number',
      initialValue: 1,
      description: 'الأرقام الأصغر تظهر أولاً.',
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  orderings: [
    {
      title: 'ترتيب العرض',
      name: 'menuOrder',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
})
