import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'
import type { SanityImage } from '../types/menu'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID?.trim()
const dataset = import.meta.env.VITE_SANITY_DATASET?.trim()
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2026-01-01'
const isConfigured = Boolean(
  projectId &&
  /^[a-z0-9]+$/.test(projectId) &&
  dataset &&
  /^[a-z0-9_-]+$/.test(dataset),
)

export const sanityClient = isConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: !import.meta.env.DEV,
      // Vite forwards local reads to Sanity without browser CORS restrictions.
      ...(import.meta.env.DEV
        ? {
            apiHost: `${window.location.origin}/api/sanity`,
            useProjectHostname: false,
          }
        : {}),
      perspective: 'published',
      timeout: 8000,
      maxRetries: 1,
    })
  : null

const imageBuilder = sanityClient ? createImageUrlBuilder(sanityClient) : null

export function imageUrl(
  image: SanityImage | null | undefined,
  width = 640,
): string | undefined {
  if (!image?.asset?._ref || !imageBuilder) return undefined
  try {
    return imageBuilder
      .image(image)
      .width(width)
      .height(width)
      .fit('crop')
      .auto('format')
      .quality(85)
      .url()
  } catch {
    return undefined
  }
}
