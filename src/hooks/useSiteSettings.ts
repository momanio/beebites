import { useEffect, useState } from 'react'
import { fallbackSettings } from '../data/fallbackMenu'
import { sanityClient } from '../lib/sanity'
import { settingsQuery } from '../lib/queries'
import type { SiteSettings } from '../types/menu'
import { resolveSiteSettings, type SettingsResponse } from '../lib/siteSettings'

export function useSiteSettings(retryKey = 0): SiteSettings {
  const [settings, setSettings] = useState(fallbackSettings)

  useEffect(() => {
    if (!sanityClient) return
    const controller = new AbortController()
    sanityClient
      .fetch<SettingsResponse | null>(
        settingsQuery,
        {},
        { signal: controller.signal },
      )
      .then((data) => {
        if (!data || controller.signal.aborted) return
        setSettings(resolveSiteSettings(data))
      })
      .catch(() => {
        /* Settings fall back silently, just like the menu. */
      })
    return () => controller.abort()
  }, [retryKey])

  return settings
}
