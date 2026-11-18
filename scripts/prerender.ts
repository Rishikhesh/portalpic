// Runs after `vite build`: writes one static HTML page per preset (/ibps-photo, /us-ds160, …) with its own
// title, description, canonical URL and share preview, plus sitemap.xml. The app reads the preset from the URL.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PRESETS } from "../src/lib/presets";
import type { Spec } from "../src/lib/spec";
import { SITE, HOME_TITLE, HOME_DESCRIPTION, pageTitle, pageDescription, heading, range } from "../src/lib/seo";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const template = readFileSync("dist/index.html", "utf8");
if (!template.includes("<!--seo-->") || !template.includes('<div id="root"></div>')) throw new Error("index.html is missing the <!--seo--> or #root markers");

function head(title: string, description: string, url: string, extra = "") {
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="PortalPic" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE}/og.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    extra,
  ].join("\n    ");
}

// Plain-HTML content for crawlers and link previews; React replaces it on load.
const body = (h1: string, lines: string[]) => `<div id="root"><main><h1>${esc(h1)}</h1>${lines.map((l) => `<p>${l}</p>`).join("")}</main></div>`;

function page(title: string, description: string, url: string, root: string, extra = "") {
  return template
    .replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, head(title, description, url, extra))
    .replace('<div id="root"></div>', root);
}

const app = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "PortalPic", url: SITE,
  applicationCategory: "MultimediaApplication", operatingSystem: "Any", isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: HOME_DESCRIPTION,
};
const presetLinks = PRESETS.map((p) => `<a href="/${p.id}">${esc(`${p.group} ${p.label}`)}</a>`).join(" · ");

writeFileSync("dist/index.html", page(HOME_TITLE, HOME_DESCRIPTION, `${SITE}/`,
  body("Resize photos and signatures for exam and visa forms", [esc(HOME_DESCRIPTION), presetLinks]),
  `<script type="application/ld+json">${JSON.stringify(app)}</script>`));

for (const p of PRESETS as Spec[]) {
  mkdirSync(`dist/${p.id}`, { recursive: true });
  const rules = `${p.w} × ${p.h} px${p.exact ? " (exact)" : ""} · ${range(p)} · JPEG${p.dpi ? ` · ${p.dpi} DPI` : ""}`;
  writeFileSync(`dist/${p.id}/index.html`, page(pageTitle(p), pageDescription(p), `${SITE}/${p.id}`,
    body(heading(p), [esc(rules), esc(p.note ?? ""), `<a href="${esc(p.source ?? "")}">Official source</a>`])));
}

const urls = ["/", ...PRESETS.map((p) => `/${p.id}`)];
writeFileSync("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u === "/" ? "/" : u}</loc></url>`).join("\n")}
</urlset>
`);
console.log(`prerendered ${PRESETS.length + 1} pages and sitemap.xml`);
