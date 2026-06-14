import { useRef, type ReactNode } from "react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Preloader } from "@/components/site/Preloader";
import { SnakeLines } from "@/components/site/SnakeLines";

/** Global page shell: grain overlay, snaking lines, navbar, content, footer. */
export function Layout({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef} className="grain relative flex min-h-screen flex-col bg-cream">
      <SnakeLines containerRef={rootRef} />
      <Preloader />
      <Navbar />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
