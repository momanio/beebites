import { useEffect, useRef, useState } from 'react'
import type { SiteSettings } from '../types/menu'
import { BrandLogo } from './BrandLogo'
import { Icon } from './Icon'
import { WhatsAppLink } from './WhatsAppLink'

const links = [
  { href: '#menu', label: 'القائمة' },
  { href: '#about', label: 'من نحن' },
  { href: '#contact', label: 'تواصل معنا' },
]

export function Header({
  settings,
  count,
}: {
  settings: SiteSettings
  count: number
}) {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    function onPointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      )
        setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    const desktop = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false)
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
      desktop.removeEventListener('change', closeOnDesktop)
    }
  }, [open])

  return (
    <header
      ref={header}
      className="site-header"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <div className="page-container header-inner">
        <a
          href="#home"
          className="brand-link"
          aria-label="بي بايتس — الصفحة الرئيسية"
          onClick={() => setOpen(false)}
        >
          <BrandLogo logo={settings.logo} />
          <span className="mobile-brand-name" lang="en" dir="ltr" aria-hidden="true">
            BeeBites
          </span>
        </a>
        <nav className="desktop-nav" aria-label="القائمة الرئيسية">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          {count > 0 && (
            <a
              className="header-bag"
              href="#cart"
              aria-label={`سلتك: ${count} قطع`}
            >
              <Icon name="bag" size={21} />
              <span>{count}</span>
            </a>
          )}
          <WhatsAppLink
            settings={settings}
            className="button header-order"
          >
            <span className="header-order-icon" aria-hidden="true">
              <Icon name="whatsapp" size={18} />
            </span>
            <span>اطلب الآن</span>
          </WhatsAppLink>
          <button
            ref={toggle}
            type="button"
            className="icon-button mobile-toggle"
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        className="mobile-nav"
        aria-label="قائمة الجوال"
        hidden={!open}
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
            <Icon name="arrow" size={18} />
          </a>
        ))}
      </nav>
    </header>
  )
}
