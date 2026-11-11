import { useLanguage } from '../hooks/useLanguage'
import type { SiteSettings } from '../types/menu'
import { BrandLogo } from './BrandLogo'
import { SocialLinks } from './SocialLinks'

export function Footer({ settings }: { settings: SiteSettings }) {
  const { t } = useLanguage()
  return (
    <footer className="site-footer">
      <div className="page-container footer-top">
        <a
          href="#home"
          className="brand-link"
          aria-label={t('بي بايتس — العودة للأعلى')}
        >
          <BrandLogo logo={settings.logo} />
        </a>
        <p>
          {t('خلية نحل . مخبوزات')}
          <br />
          <span>{t('من بيتنا في الأردن، لجمعتكم الحلوة.')}</span>
        </p>
        <SocialLinks settings={settings} compact />
      </div>
      <div className="page-container footer-bottom">
        <span>{t('بي بايتس — طراوة بكل لقمة')}</span>
        <p dir="ltr">
          © {new Date().getFullYear()}{' '}
          <a
            href="https://omarmomani.is-a.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Omar Momani
          </a>
          . All rights reserved.
        </p>
      </div>
    </footer>
  )
}
