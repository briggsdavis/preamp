import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import { ConvexProvider } from "@/providers/ConvexProvider";
import "@/styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <ConvexProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>,
);
