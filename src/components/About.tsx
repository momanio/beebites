import { aboutCards } from '../data/about'
import { Icon } from './Icon'
import { Reveal } from './Reveal'

const icons = ['cloud', 'sparkles', 'home'] as const

export function About() {
  return (
    <section
      id="about"
      className="about-section section-space"
      aria-labelledby="about-title"
    >
      <div className="page-container">
        <Reveal className="section-heading">
          <p className="eyebrow">الحلو في التفاصيل</p>
          <h2 id="about-title">ليش بي بايتس؟</h2>
          <p>لأن الخلية الحلوة بتبدأ من القلب.</p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {aboutCards.map((card, index) => (
            <Reveal key={card._key} delay={index * 0.08} className="value-card">
              <span className="hex-icon">
                <Icon name={icons[index % icons.length]} size={30} />
              </span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
