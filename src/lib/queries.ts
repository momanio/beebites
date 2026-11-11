// Published category references take priority; old products remain readable
// until their legacy sweet/savory choices have been migrated.
export const productCategoryExpression = `select(
  defined(category->_id) => category._ref,
  menuCategory == "savory" => coalesce(*[_type == "category" && slug.current == "savory"][0]._id, "category-savory"),
  menuCategory == "sweet" => coalesce(*[_type == "category" && slug.current == "sweet"][0]._id, "category-sweet"),
  "category-sweet"
)`

export const menuQuery = `{
  "categories": *[_type == "category"] | order(order asc, title asc) {
    _id, title, titleEn, "slug": slug.current, "order": coalesce(order, 0),
    "parentId": parent._ref
  },
  "products": *[_type == "product" && available != false] | order(order asc, name asc) {
    _id, name, nameEn, subtitle, subtitleEn, "categoryId": ${productCategoryExpression},
    "categoryTitle": category->title, price, image,
    description, descriptionEn, badge, badgeEn, heroHighlight, "comingSoon": coalesce(comingSoon, false),
    "available": coalesce(available, true), "order": coalesce(order, 0)
  }
}`

export const settingsQuery = `*[_type == "siteSettings" && _id == "siteSettings"][0] {
  whatsappNumber, defaultWhatsappMessage, heroSlogan, heroSubline,
  highlightTitle, highlightText, orderNote, instagramUrl, facebookUrl,
  defaultWhatsappMessageEn, heroSloganEn, heroSublineEn,
  highlightTitleEn, highlightTextEn, orderNoteEn, announcement, logo
}`
