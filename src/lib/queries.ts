import { menuCategories } from '../data/menuCategories.ts'

// Retain old category references while new products use a simple fixed choice.
// Older products without a category appear under حلو until the owner assigns one.
export const productCategoryExpression = `select(
  menuCategory == "sweet" => "category-sweet",
  menuCategory == "savory" => "category-savory",
  category._ref == "category-savory" || category->slug.current == "savory" || category->title in ["مالح", "المالح"] => "category-savory",
  "category-sweet"
)`

export const menuQuery = `{
  "categories": ${JSON.stringify(menuCategories)},
  "products": *[_type == "product" && available != false] | order(order asc, name asc) {
    _id, name, subtitle, "categoryId": ${productCategoryExpression}, price, image,
    description, badge, "comingSoon": coalesce(comingSoon, false),
    "available": coalesce(available, true), "order": coalesce(order, 0)
  }
}`

export const settingsQuery = `*[_type == "siteSettings" && _id == "siteSettings"][0] {
  whatsappNumber, defaultWhatsappMessage, heroSlogan, heroSubline,
  highlightTitle, highlightText, orderNote, instagramUrl, facebookUrl,
  announcement, logo
}`
