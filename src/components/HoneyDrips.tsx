import { useId } from 'react'

export function HoneyDrips() {
  const id = useId()
  const honey = `${id}-honey`
  const sheen = `${id}-sheen`
  const glass = `${id}-glass`
  const droplet = `${id}-droplet`

  return (
    <svg
      className="honey-drips"
      width="300"
      height="240"
      viewBox="0 0 300 240"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={honey} x1="0" y1="0" x2="0.85" y2="1">
          <stop stopColor="#fff0ad" stopOpacity=".75" />
          <stop offset=".28" stopColor="#f8c157" stopOpacity=".82" />
          <stop offset=".58" stopColor="#e49b21" stopOpacity=".88" />
          <stop offset=".82" stopColor="#d78313" stopOpacity=".94" />
          <stop offset="1" stopColor="#f4b943" stopOpacity=".9" />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2=".3" y2="1">
          <stop stopColor="#fffdf0" stopOpacity=".95" />
          <stop offset=".65" stopColor="#fff5ca" stopOpacity=".65" />
          <stop offset="1" stopColor="#fff5ca" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={droplet} cx=".32" cy=".23" r=".8">
          <stop stopColor="#fff4c4" stopOpacity=".9" />
          <stop offset=".32" stopColor="#f5bd48" stopOpacity=".86" />
          <stop offset=".78" stopColor="#d78b1e" stopOpacity=".94" />
          <stop offset="1" stopColor="#b97216" stopOpacity=".9" />
        </radialGradient>
        <filter id={glass} x="-20%" y="-15%" width="140%" height="145%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="surface" />
          <feSpecularLighting in="surface" surfaceScale="5" specularConstant=".65" specularExponent="24" lightingColor="#fff9df" result="reflection">
            <fePointLight x="-60" y="-100" z="180" />
          </feSpecularLighting>
          <feComposite in="reflection" in2="SourceAlpha" operator="in" result="clipped-reflection" />
          <feBlend in="SourceGraphic" in2="clipped-reflection" mode="screen" />
          <feDropShadow dx="1" dy="5" stdDeviation="4" floodColor="#a9600c" floodOpacity=".2" />
        </filter>
      </defs>
      <g filter={`url(#${glass})`}>
        <path
          d="M-8-12H308V54c-13-7-20 0-19 13l2 21c2 17-4 27-14 25-12-2-11-14-9-28l2-32c1-15-15-20-21-5-7 17-2 43-3 66-1 20 5 34 1 46-5 17-25 20-32 5-5-11 1-25 2-39l2-52c1-19-17-24-22-9-4 11 0 22-6 30-8 11-22 6-24-5-2-9 3-19 2-29l-2-19c-2-16-20-15-24-1-5 17 0 39-2 54-2 17-19 24-27 11-6-10 0-24 0-36V47c0-16-18-19-24-5-4 9-2 17-6 24-7 12-24 9-26-3-2-9 2-18-1-26-5-13-18-15-29-12C12 29 0 22-8 13Z"
          fill={`url(#${honey})`}
          stroke="#f5d38a"
          strokeWidth="1"
          strokeOpacity=".8"
        />
        <g fill="none" stroke={`url(#${sheen})`} strokeLinecap="round">
          <path d="M20 15c17-5 33 1 39 14M92 24c17-3 29 6 28 24M152 23c15-2 24 8 24 22M203 40c15-8 26 5 24 25" strokeWidth="3" />
          <path d="M122 58c-2 18 1 32-3 40M225 80c-3 28 2 51-4 69M275 61c-2 16-3 27-1 34" strokeWidth="4" />
          <path d="M226 163c7 5 14-2 14-9M121 106c5 4 12 0 13-5" strokeWidth="2" opacity=".65" />
        </g>
      </g>
      <g className="honey-drop honey-drop-one">
        <path d="M229 188c-1 5-8 11-8 17a9 9 0 0 0 18 0c0-6-7-12-10-17Z" fill={`url(#${droplet})`} />
        <path d="M226 200c-2 3-2 6 0 8" fill="none" stroke="#fff5ce" strokeWidth="2" strokeLinecap="round" opacity=".85" />
      </g>
      <g className="honey-drop honey-drop-two">
        <path d="M128 133c-2 4-6 8-6 12a6 6 0 0 0 12 0c0-4-4-8-6-12Z" fill={`url(#${droplet})`} />
        <path d="M126 142v4" stroke="#fff5ce" strokeWidth="1.5" strokeLinecap="round" opacity=".8" />
      </g>
    </svg>
  )
}
