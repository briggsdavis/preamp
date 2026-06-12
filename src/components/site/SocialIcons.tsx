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
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M16.5 3c.3 1.9 1.4 3.4 3.2 3.9.6.2 1.2.3 1.8.3v3.1a7.6 7.6 0 0 1-4.6-1.5v6.4a6 6 0 1 1-6-6c.3 0 .6 0 .9.1v3.2a2.8 2.8 0 1 0 2 2.7V3h2.7z" />
    </svg>
  );
}
