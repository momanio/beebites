import { useEffect, useState } from 'react'
import { fallbackMenu } from '../data/fallbackMenu'
import { sanityClient } from '../lib/sanity'
import { menuQuery } from '../lib/queries'
import { resolveMenu } from '../lib/menu'
import type { MenuData } from '../types/menu'

export function useMenu() {
  const [menu, setMenu] = useState<MenuData>(fallbackMenu)
  const [loading, setLoading] = useState(Boolean(sanityClient))

  useEffect(() => {
    if (!sanityClient) return
    const client = sanityClient
    const controller = new AbortController()
    let refreshing = false

    async function refresh() {
      if (refreshing || controller.signal.aborted) return
      refreshing = true
      try {
        const data = await client.fetch<MenuData>(
          menuQuery,
          {},
          { signal: controller.signal },
        )
        if (!Array.isArray(data?.categories) || !Array.isArray(data?.products))
          throw new Error('Invalid menu')
        if (!controller.signal.aborted)
          setMenu(resolveMenu(data))
      } catch (error) {
        if (import.meta.env.DEV && !controller.signal.aborted)
          console.warn(
            '[BeeBites] Could not load the published Sanity menu. Keeping the last menu. Check the Vite terminal, project/dataset and public dataset visibility.',
            error,
          )
      } finally {
        refreshing = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    const refreshWhenVisible = () => {
      if (!document.hidden) void refresh()
    }

    void refresh()
    window.addEventListener('focus', refreshWhenVisible)
    window.addEventListener('online', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    // Keep the local site in sync while editing products in another window.
    const interval = import.meta.env.DEV
      ? window.setInterval(refreshWhenVisible, 5000)
      : undefined

    return () => {
      controller.abort()
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshWhenVisible)
      window.removeEventListener('online', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  return { ...menu, loading }
}
