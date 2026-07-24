import { type ReactNode } from "react"

/**
 * Wraps a routed page. Pages render instantly on navigation - no entrance
 * fade or slide. Any "reveal" motion happens on scroll (see <Reveal>), not on
 * page open, so a new page is fully visible the moment it mounts.
 */
export function PageWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>
}
