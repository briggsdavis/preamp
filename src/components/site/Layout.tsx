import { type ReactNode } from "react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Preloader } from "@/components/site/Preloader";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PopupHost } from "@/components/site/PopupHost";

/** Global page shell: grain overlay, fixed navbar, routed content, footer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grain flex min-h-screen flex-col">
      <Preloader />
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <PopupHost />
    </div>
  );
}
