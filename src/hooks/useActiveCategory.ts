import { useEffect, useRef, useState } from 'react'
import type { Category } from '../types/menu'

export function useActiveCategory(categories: Category[], enabled: boolean) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const navigationTarget = useRef<string | null>(null)
  const scheduleNavigationEnd = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled) return
    const categoryIds = new Set(categories.map((category) => category._id))
    const sections = [...document.querySelectorAll<HTMLElement>('.category-section')]
      .filter((section) => categoryIds.has(section.id.slice('category-'.length)))
    let frame = 0
    let navigationTimeout: number | undefined

    function update() {
      frame = 0
      // Keep the clicked category selected while smooth scrolling passes others.
      if (navigationTarget.current && categoryIds.has(navigationTarget.current)) return
      navigationTarget.current = null
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      let current = sections[0]

      for (const section of sections) {
        const margin = parseFloat(getComputedStyle(section).scrollMarginBlockStart) || 0
        if (section.getBoundingClientRect().top <= padding + margin + 4)
          current = section
      }

      setActiveCategoryId(current?.id.slice('category-'.length) ?? null)
    }

    function scheduleUpdate() {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    function finishNavigation() {
      window.clearTimeout(navigationTimeout)
      navigationTarget.current = null
      scheduleUpdate()
    }

    function waitForScrollToSettle() {
      window.clearTimeout(navigationTimeout)
      navigationTimeout = window.setTimeout(finishNavigation, 180)
    }

    function onScroll() {
      if (navigationTarget.current) waitForScrollToSettle()
      else scheduleUpdate()
    }

    function onScrollKey(event: KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key))
        finishNavigation()
    }

    function readHash() {
      const section = sections.find((item) => `#${item.id}` === window.location.hash)
      if (section) {
        const id = section.id.slice('category-'.length)
        navigationTarget.current = id
        setActiveCategoryId(id)
        waitForScrollToSettle()
      } else finishNavigation()
    }

    scheduleNavigationEnd.current = waitForScrollToSettle
    if (navigationTarget.current) waitForScrollToSettle()
    scheduleUpdate()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', finishNavigation, { passive: true })
    window.addEventListener('touchstart', finishNavigation, { passive: true })
    window.addEventListener('keydown', onScrollKey)
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('hashchange', readHash)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(navigationTimeout)
      scheduleNavigationEnd.current = null
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', finishNavigation)
      window.removeEventListener('touchstart', finishNavigation)
      window.removeEventListener('keydown', onScrollKey)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('hashchange', readHash)
    }
  }, [categories, enabled])

  function selectCategory(id: string) {
    navigationTarget.current = id
    setActiveCategoryId(id)
    scheduleNavigationEnd.current?.()
  }

  return { activeCategoryId, selectCategory }
}
