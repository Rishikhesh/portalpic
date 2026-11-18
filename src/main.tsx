import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";
import App from "./App";
import { inject } from "@vercel/analytics";

// Cookieless page-view counts, sent only to this site (/_vercel/insights). Never image data.
inject();

// Offline support (public/sw.js). Production only, so dev reloads stay fresh.
if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/sw.js").catch(() => {});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
