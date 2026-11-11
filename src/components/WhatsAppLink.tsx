import type { ReactNode } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import type { SiteSettings } from '../types/menu'
import { whatsappUrl } from '../lib/whatsapp'

interface WhatsAppLinkProps {
  settings: SiteSettings
  message?: string
  children: ReactNode
  className?: string
  label?: string
}

export function WhatsAppLink({
  settings,
  message,
  children,
  className = '',
  label,
}: WhatsAppLinkProps) {
  const { t } = useLanguage()
  const href = whatsappUrl(
    settings.whatsappNumber,
    message ?? settings.defaultWhatsappMessage,
  )
  if (!href)
    return (
      <button
        type="button"
        className={className}
        disabled
        aria-label={
          label ? `${label} — ${t('الطلب عبر واتساب متاح قريباً')}` : undefined
        }
        title={t('الطلب عبر واتساب متاح قريباً')}
      >
        {children}
      </button>
    )
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      {children}
    </a>
  )
}
