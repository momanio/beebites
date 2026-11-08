import { motion, useReducedMotion } from 'motion/react'
import { Icon } from './Icon'

export function SectionTitle({ title, id }: { title: string; id?: string }) {
  const reducedMotion = useReducedMotion()
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
        <h2 id={id}>{title}</h2>
      </div>
      <Icon name="hexagon" size={21} className="title-hex" />
      <span className="section-divider" />
    </div>
  )
}
