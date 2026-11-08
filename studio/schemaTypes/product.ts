import { defineField, defineType } from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'المنتجات',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'اسم المنتج',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'وصف قصير',
      type: 'string',
      description: 'مثال: (وايت شوكليت و قرفة)',
    }),
    defineField({
      name: 'menuCategory',
      title: 'القسم القديم',
      type: 'string',
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'category',
      title: 'القسم',
      type: 'reference',
      to: [{ type: 'category' }],
      description:
        'اختر قسماً رئيسياً أو فرعياً. يمكنك إنشاء قسم جديد من هنا أو من إدارة الأقسام، ثم نشره قبل نشر المنتج.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'السعر بالدينار الأردني',
      type: 'number',
      validation: (rule) => rule.required().min(0).precision(2),
    }),
    defineField({
      name: 'image',
      title: 'صورة المنتج',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'description',
      title: 'وصف المنتج',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'badge',
      title: 'شارة المنتج',
      type: 'string',
      description: 'مثال: قريباً، حشوة لوتس',
    }),
    defineField({
      name: 'comingSoon',
      title: 'قريباً — إيقاف الطلب مؤقتاً',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'available',
      title: 'إظهار المنتج في الموقع',
      type: 'boolean',
      initialValue: true,
      description: 'فعّل هذا الخيار واضغط Publish ليظهر المنتج في الموقع.',
    }),
    defineField({
      name: 'order',
      title: 'ترتيب المنتج داخل القسم',
      type: 'number',
      initialValue: 1,
      description:
        'غيّر الرقم وأعد النشر لترتيب المنتجات. الأرقام الأصغر تظهر أولاً.',
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  orderings: [
    {
      title: 'ترتيب القائمة',
      name: 'menuOrder',
      by: [
        { field: 'order', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
    },
    {
      title: 'السعر',
      name: 'priceOrder',
      by: [{ field: 'price', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      price: 'price',
      media: 'image',
      order: 'order',
      available: 'available',
    },
    prepare({ title, price, media, order, available }) {
      return {
        title,
        media,
        subtitle: `${order ?? '—'} · ${price ?? '—'} JD${available === false ? ' · مخفي' : ''}`,
      }
    },
  },
})
