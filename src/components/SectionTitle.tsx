import { motion, useReducedMotion } from 'motion/react'
import { Icon } from './Icon'

export function SectionTitle({
  title,
  id,
  subcategory = false,
  as,
}: {
  title: string
  id?: string
  subcategory?: boolean
  as?: 'h2' | 'h3' | 'p'
}) {
  const reducedMotion = useReducedMotion()
  const Heading = as ?? (subcategory ? 'h3' : 'h2')

  if (subcategory) {
    return (
      <Heading className="subcategory-title" id={id}>
        <span />
        {title}
        <span />
      </Heading>
    )
  }

  return (
    <div className="section-title-wrap">
      <span className="section-divider" />
      <motion.span
        className="title-hex"
        initial={false}
        whileInView={{ color: '#C97F14' }}
        viewport={{ once: true }}
      >
        <Icon name="hexagon" size={21} />
      </motion.span>
      <div className="section-banner">
        <div className="title-cells" aria-hidden="true">
          {[0, 1, 2].map((cell) => (
            <motion.span
              key={cell}
              initial={reducedMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: reducedMotion ? 0 : cell * 0.15,
                duration: reducedMotion ? 0 : 0.4,
              }}
            />
          ))}
        </div>
        <Heading className="section-banner-title" id={id}>{title}</Heading>
      </div>
      <Icon name="hexagon" size={21} className="title-hex" />
      <span className="section-divider" />
    </div>
  )
}
