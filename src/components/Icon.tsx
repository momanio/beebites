import type { CSSProperties, ReactNode } from 'react'

type IconName =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'arrow'
  | 'bag'
  | 'heart'
  | 'wheat'
  | 'cloud'
  | 'sparkles'
  | 'home'
  | 'clock'
  | 'menu'
  | 'close'
  | 'plus'
  | 'minus'
  | 'hexagon'
  | 'play'
  | 'pause'

const paths: Record<IconName, ReactNode> = {
  whatsapp: (
    <>
      <path d="M20.5 11.6a8.6 8.6 0 0 1-12.8 7.5L3 20.5l1.4-4.6a8.6 8.6 0 1 1 16.1-4.3Z" />
      <path d="m8 7 1.5 2.8-1.1 1.1a10 10 0 0 0 4.7 4.2l1-1.5 2.9 1.4c-.4 2.8-3.5 2.3-6.2.5-3.1-2-5.4-5.6-2.8-8.5Z" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  facebook: (
    <path d="M14.5 22v-9H18l.5-4h-4V6.5c0-1.1.3-1.7 2-1.7H19V1.2C18.5 1.1 17.1 1 15.6 1 12.3 1 10 3 10 6.6V9H7v4h3v9" />
  ),
  arrow: <path d="m10 6-6 6 6 6M4 12h16" />,
  bag: (
    <>
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M8 9V6a4 4 0 0 1 8 0v3" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  wheat: (
    <>
      <path d="M12 22V2M12 9C6 9 4 6 4 3c5 0 8 3 8 6Zm0 6c-6 0-8-3-8-6 5 0 8 3 8 6Zm0 6c-6 0-8-3-8-6 5 0 8 3 8 6Zm0-12c6 0 8-3 8-6-5 0-8 3-8 6Zm0 6c6 0 8-3 8-6-5 0-8 3-8 6Zm0 6c6 0 8-3 8-6-5 0-8 3-8 6Z" />
    </>
  ),
  cloud: (
    <path d="M6.5 19a5.5 5.5 0 1 1 1-10.9 6.5 6.5 0 0 1 12.3 2.4A4.3 4.3 0 0 1 18 19Z" />
  ),
  sparkles: (
    <>
      <path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z" />
      <path d="M21 2v4M19 4h4" />
    </>
  ),
  home: (
    <>
      <path d="m2 11 10-9 10 9M5 9v12h14V9" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 12-12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  hexagon: <path d="m12 2 9 5v10l-9 5-9-5V7Z" />,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
}

export function Icon({
  name,
  size = 24,
  className = '',
  style,
}: {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
