import type { SiteSettings } from '../types/menu'
import { Bee } from './Bee'
import { Icon } from './Icon'
import { Reveal } from './Reveal'
import { SocialLinks } from './SocialLinks'

export function SocialSection({ settings }: { settings: SiteSettings }) {
  return (
    <section
      id="contact"
      className="social-section"
      aria-labelledby="social-title"
    >
      <div className="page-container">
        <Reveal className="social-panel">
          <div className="hex-corner hex-corner-end" aria-hidden="true" />
          <div className="social-copy">
            <p className="eyebrow">خلّينا قريبين</p>
            <h2 id="social-title">
              للحلو، دايماً في مكان <Icon name="heart" size={29} />
            </h2>
            <p>تابعونا وشوفوا شو طالع من الفرن اليوم.</p>
            <p className="social-handle" dir="ltr">
              @BeeBites.Jo
            </p>
            <SocialLinks settings={settings} />
          </div>
          <div className="social-art" aria-hidden="true">
            <span className="social-large-heart">♡</span>
            <span>مخبوزة بحبّ</span>
            <Icon name="wheat" size={56} />
          </div>
        </Reveal>
        <Bee />
      </div>
    </section>
  )
}
