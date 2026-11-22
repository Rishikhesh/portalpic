import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/anek-latin/wght.css";
import "./index.css";
import App from "./App";
import { inject } from "@vercel/analytics";

// Cookieless page-view counts, sent only to this site (/_vercel/insights). Never image data.
inject();

// Offline support (public/sw.js). Production only, so dev reloads stay fresh.
if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/sw.js").catch(() => {});

// The PDF tool (pdf.js + pdf-lib, ~1 MB) loads only on /pdf, so the photo tool stays light.
const isPdf = location.pathname.replace(/\/$/, "") === "/pdf";
const PdfApp = lazy(() => import("./PdfApp"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isPdf ? <Suspense><PdfApp /></Suspense> : <App />}
  </StrictMode>,
);
