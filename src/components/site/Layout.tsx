import { type ReactNode } from "react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Preloader } from "@/components/site/Preloader";

/** Global page shell: grain overlay, fixed navbar, routed content, footer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grain flex min-h-screen flex-col">
      <Preloader />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
