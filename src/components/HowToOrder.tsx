import { useLanguage } from '../hooks/useLanguage'
import { Icon } from './Icon'
import { Reveal } from './Reveal'

const steps = [
  {
    title: 'اختر',
    text: 'اختار خلاياك المفضلة وحدّد الكمية. صندوقك على ذوقك.',
    icon: 'bag',
  },
  {
    title: 'راسلنا على واتساب',
    text: 'أرسل صندوقك برسالة، وبنرتّب معك كل التفاصيل.',
    icon: 'whatsapp',
  },
  {
    title: 'نخبزها طازجة',
    text: 'نحضّر طلبك بحب، وتوصلك ريحة الخبز قبل أول لقمة.',
    icon: 'wheat',
  },
] as const

export function HowToOrder({ note }: { note: string }) {
  const { t } = useLanguage()
  return (
    <section
      className="order-section section-space"
      aria-labelledby="order-title"
    >
      <div className="page-container">
        <Reveal className="section-heading">
          <p className="eyebrow">{t('من الفرن… لجمعتكم')}</p>
          <h2 id="order-title">{t('ثلاث خطوات، وبيحلى يومك')}</h2>
        </Reveal>
        <ol className="order-steps grid gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={t(step.title)}>
              <Reveal delay={index * 0.08}>
                <div className="step-icon">
                  <span className="step-number">0{index + 1}</span>
                  <Icon name={step.icon} size={28} />
                </div>
                <h3>{t(step.title)}</h3>
                <p>{t(step.text)}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        {note && (
          <Reveal className="order-note">
            <Icon name="clock" size={23} />
            <p>{note}</p>
          </Reveal>
        )}
      </div>
    </section>
  )
}
