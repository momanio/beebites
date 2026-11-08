import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'motion/react'

function FlyingBee() {
  const path = useRef<SVGPathElement>(null)
  const { scrollYProgress } = useScroll()
  const x = useMotionValue(20)
  const y = useMotionValue(80)
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (!path.current) return
    const point = path.current.getPointAtLength(
      path.current.getTotalLength() * value,
    )
    x.set(point.x)
    y.set(point.y)
  })
  return (
    <div className="bee-trail" aria-hidden="true">
      <svg viewBox="0 0 560 130" fill="none">
        <path
          ref={path}
          d="M20 80C110 4 160 130 255 65S420 5 530 65"
          stroke="currentColor"
          strokeDasharray="3 7"
          strokeLinecap="round"
        />
        <motion.g style={{ x, y }}>
          <ellipse
            cx="-4"
            cy="-11"
            rx="6"
            ry="10"
            transform="rotate(-25)"
            fill="#FFF8EA"
            stroke="#7A4A25"
          />
          <ellipse
            cx="7"
            cy="-12"
            rx="6"
            ry="10"
            transform="rotate(20)"
            fill="#FFF8EA"
            stroke="#7A4A25"
          />
          <ellipse
            rx="15"
            ry="10"
            fill="#E9A83A"
            stroke="#3B2314"
            strokeWidth="1.5"
          />
          <path d="M-6-9v18M2-10v20" stroke="#3B2314" strokeWidth="4" />
          <circle cx="13" cy="-2" r="2" fill="#3B2314" />
          <path
            d="m-16 0-5-2 4 5M15-9l3-5"
            stroke="#3B2314"
            strokeWidth="1.5"
          />
        </motion.g>
      </svg>
    </div>
  )
}

export function Bee() {
  const reducedMotion = useReducedMotion()
  return reducedMotion ? null : <FlyingBee />
}
