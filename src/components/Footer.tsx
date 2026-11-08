import type { SiteSettings } from '../types/menu'
import { BrandLogo } from './BrandLogo'
import { SocialLinks } from './SocialLinks'

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-footer">
      <div className="page-container footer-top">
        <a
          href="#home"
          className="brand-link"
          aria-label="بي بايتس — العودة للأعلى"
        >
          <BrandLogo logo={settings.logo} />
        </a>
        <p>
          خلية نحل . مخبوزات
          <br />
          <span>من بيتنا في الأردن، لجمعتكم الحلوة.</span>
        </p>
        <SocialLinks settings={settings} compact />
      </div>
      <div className="page-container footer-bottom">
        <span>بي بايتس — طراوة بكل لقمة</span>
        <p dir="ltr">
          © {new Date().getFullYear()} Omar Momani. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
