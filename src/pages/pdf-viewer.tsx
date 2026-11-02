import { useEffect } from "react"
import { OperationalFeeNotice } from "@/components/menu/operational-fee-notice"

/**
 * Full-screen PDF viewer served from our own origin, so the browser tab shows
 * the site favicon and a branded title rather than the raw storage URL's. The
 * menu's "View Menu PDF" link opens /menu-pdf?src=<encoded pdf url> in a new
 * tab, which embeds the PDF here.
 */
export function PdfViewer() {
  const src = new URLSearchParams(window.location.search).get("src")

  useEffect(() => {
    document.title = "Pre Amp · Menu"
  }, [])

  if (!src) {
    return (
      <div className="flex h-screen items-center justify-center bg-espresso text-cream">
        <p className="font-display text-2xl">No menu PDF to show.</p>
      </div>
    )
  }

  return (
    <main className="bg-cream">
      <iframe title="Pre Amp Menu PDF" src={src} className="h-[80vh] w-full border-0" />
      <div className="px-5 py-8 md:px-8">
        <OperationalFeeNotice />
      </div>
    </main>
  )
}
