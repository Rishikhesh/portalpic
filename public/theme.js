// Applies the look the visitor picked (light or dark) before the page paints, so there is no flash.
// Without a pick, CSS follows the device setting.
try { var t = localStorage.getItem("pp.theme"); if (t === "dark" || t === "light") document.documentElement.dataset.theme = t; } catch (e) { /* private mode */ }
