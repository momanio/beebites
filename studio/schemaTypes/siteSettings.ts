import { defineArrayMember, defineField, defineType } from 'sanity'
import { AboutCardsInput } from '../components/AboutCardsInput'
import { getInitialSiteSettings } from '../defaults'
import {
  validateWhatsappNumber,
  whatsappSetupWarning,
} from '../../src/lib/siteSettings'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'إعدادات الموقع',
  type: 'document',
  initialValue: getInitialSiteSettings,
  groups: [
    { name: 'hero', title: 'الواجهة', default: true },
    { name: 'orders', title: 'الطلبات والتواصل' },
    { name: 'about', title: 'من نحن' },
    { name: 'english', title: 'English translations' },
  ],
  fields: [
    ...[
      { name: 'heroSloganEn', title: 'English slogan', type: 'string' },
      { name: 'heroSublineEn', title: 'English subline', type: 'string' },
      { name: 'highlightTitleEn', title: 'English ribbon heading', type: 'string' },
      { name: 'highlightTextEn', title: 'English ribbon details', type: 'text' },
      { name: 'defaultWhatsappMessageEn', title: 'English WhatsApp greeting', type: 'text' },
      { name: 'orderNoteEn', title: 'English ordering note', type: 'text' },
    ].map((field) => defineField({ ...field, group: 'english', description: 'Optional English translation. The Arabic text is preserved.' })),
    defineField({
      name: 'heroSlogan',
      title: 'الشعار الرئيسي',
      type: 'string',
      group: 'hero',
      description: 'اتركه فارغاً لاستخدام الشعار الافتراضي للموقع.',
    }),
    defineField({
      name: 'heroSubline',
      title: 'النص تحت الشعار',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'logo',
      title: 'الشعار الأصلي',
      type: 'image',
      group: 'hero',
      description:
        'اختياري. ارفع الشعار الأصلي كما هو؛ عند تركه فارغاً يستخدم الموقع /logo.jpg.',
    }),
    defineField({
      name: 'highlightTitle',
      title: 'عنوان الشريط الأحمر',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'highlightText',
      title: 'تفاصيل الشريط الأحمر',
      type: 'text',
      rows: 2,
      group: 'hero',
    }),
    defineField({
      name: 'announcement',
      title: 'الإعلان',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({ name: 'textEn', title: 'English announcement', type: 'string' }),
        defineField({
          name: 'enabled',
          title: 'إظهار الإعلان',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'text',
          title: 'نص الإعلان',
          type: 'string',
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { enabled?: boolean } | undefined
              return parent?.enabled && !value?.trim()
                ? 'أضف نص الإعلان قبل تفعيله'
                : true
            }),
        }),
      ],
    }),
    defineField({
      name: 'whatsappNumber',
      title: 'رقم واتساب الدولي',
      type: 'string',
      group: 'orders',
      description:
        'أرقام فقط مع رمز الدولة، مثال الأردن يبدأ بـ 9627. الرقم الفارغ أو التجريبي يعطّل الطلب عبر واتساب دون منع نشر باقي المحتوى.',
      validation: (rule) => [
        rule.custom(validateWhatsappNumber),
        rule.custom(whatsappSetupWarning).warning(),
      ],
    }),
    defineField({
      name: 'defaultWhatsappMessage',
      title: 'رسالة واتساب الافتراضية',
      type: 'text',
      rows: 2,
      group: 'orders',
      description: 'اتركها فارغة لاستخدام رسالة الترحيب الافتراضية.',
    }),
    defineField({
      name: 'orderNote',
      title: 'ملاحظة الطلب المسبق',
      type: 'text',
      rows: 3,
      group: 'orders',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'رابط إنستغرام',
      type: 'url',
      group: 'orders',
      validation: (rule) => rule.uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'facebookUrl',
      title: 'رابط فيسبوك',
      type: 'url',
      group: 'orders',
      validation: (rule) => rule.uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'aboutCards',
      title: 'بطاقات من نحن',
      type: 'array',
      group: 'about',
      description:
        'كل بطاقة تحتاج عنواناً ونصاً. ننصح بثلاث بطاقات، ويمكن نشر عدد مختلف. التغييرات تظهر على الموقع بعد الضغط على Publish وتحديث الصفحة.',
      components: { input: AboutCardsInput },
      of: [
        defineArrayMember({
          type: 'object',
          name: 'aboutCard',
          fields: [
            defineField({
              name: 'title',
              title: 'العنوان',
              type: 'string',
              validation: (rule) =>
                rule
                  .required()
                  .custom((value) =>
                    !value || value.trim() ? true : 'أضف عنوان البطاقة قبل النشر',
                  )
                  .error('أضف عنوان البطاقة قبل النشر'),
            }),
            defineField({
              name: 'text',
              title: 'النص',
              type: 'text',
              rows: 3,
              validation: (rule) =>
                rule
                  .required()
                  .custom((value) =>
                    !value || value.trim() ? true : 'أضف نص البطاقة قبل النشر',
                  )
                  .error('أضف نص البطاقة قبل النشر'),
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'text' } },
        }),
      ],
      validation: (rule) =>
        rule
          .custom((value) =>
            value?.length === 3
              ? true
              : 'ننصح بثلاث بطاقات لتنسيق القسم، لكن عدد البطاقات لا يمنع النشر.',
          )
          .warning(),
    }),
  ],
  preview: { prepare: () => ({ title: 'إعدادات بي بايتس' }) },
})
