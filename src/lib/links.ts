export const REPO = "https://github.com/Rishikhesh/portalpic";

// Google Form for people without a GitHub account. Paste the form's share link here; empty hides the option.
export const REQUEST_FORM_URL = "https://forms.gle/gWTPthBeRC2ScrZy9";

// GitHub issue form (.github/ISSUE_TEMPLATE/preset-request.yml), prefilled with what the user searched for.
export function requestPresetUrl(search = "") {
  const q = new URLSearchParams({ template: "preset-request.yml", title: `Preset request: ${search.trim() || "<form / country>"}` });
  if (search.trim()) q.set("portal", search.trim());
  return `${REPO}/issues/new?${q}`;
}
