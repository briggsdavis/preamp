import { type ReactNode } from "react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

/** Global page shell: grain overlay, fixed navbar, routed content, footer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grain flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
