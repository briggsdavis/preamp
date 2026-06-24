import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

import App from "@/App";
import "@/styles/index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "VITE_CONVEX_URL is not set. Run `npx convex dev` (writes it to .env.local) " +
      "and set it in your Vercel environment variables.",
  );
}

// Single Convex client for the whole app. `ConvexAuthProvider` layers Convex
// Auth (sign-in/out, session tokens) on top of it so any component can read
// auth state or call authed queries/mutations.
const convex = new ConvexReactClient(convexUrl);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>,
);
