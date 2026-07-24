import { Component, type ReactNode } from "react"

/**
 * Catches render-time errors in its subtree and shows a fallback instead of
 * letting the whole app unmount (a blank screen).
 *
 * This matters because Convex's `useQuery` throws during render when a query
 * errors (e.g. the backend functions aren't deployed yet). Wrapping the
 * Convex-consuming widgets keeps the rest of the page alive.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // Surface the real cause in the console for debugging.
    console.error("Render error caught by ErrorBoundary:", error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
