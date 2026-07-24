/** Brand glyphs for the footer social links. Inherit color via `currentColor`. */

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M16.5 3c.3 1.9 1.4 3.4 3.2 3.9.6.2 1.2.3 1.8.3v3.1a7.6 7.6 0 0 1-4.6-1.5v6.4a6 6 0 1 1-6-6c.3 0 .6 0 .9.1v3.2a2.8 2.8 0 1 0 2 2.7V3h2.7z" />
    </svg>
  )
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M14 8.5V7.2c0-1 .7-1.2 1.2-1.2H18V2.1L14.6 2C10.8 2 10 4.8 10 6.7v1.8H7v4.3h3V22h4v-9.2h3.5l.5-4.3H14Z" />
    </svg>
  )
}

export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M21.6 6.3a2.8 2.8 0 0 0-2-2C17.8 3.8 12 3.8 12 3.8s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 5.7 2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-5.7ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  )
}

export function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.51 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    </svg>
  )
}

export function SocialIcon({
  platform,
  className,
}: {
  platform: "instagram" | "facebook" | "tiktok" | "youtube" | "x"
  className?: string
}) {
  switch (platform) {
    case "instagram":
      return <InstagramIcon className={className} />
    case "facebook":
      return <FacebookIcon className={className} />
    case "tiktok":
      return <TikTokIcon className={className} />
    case "youtube":
      return <YouTubeIcon className={className} />
    case "x":
      return <XIcon className={className} />
  }
}
