// icon() — inline Phosphor SVG helper.
//
// Templates in this codebase are built synchronously via string
// interpolation (see components/*.js), so the helper returns a plain
// string rather than a Promise: `` `<summary>${icon("caret-right")}...` ``.
//
// The SVG markup is inlined here (not fetched at render time) so callers
// can drop it straight into a template string with no async plumbing.
// public/icons/*.svg remain the source-of-truth copies — this file is
// generated from them, so if the rendered icon ever looks wrong, diff it
// against the file in public/icons/ first.
//
// To add a new icon:
//   1. Download the SVG (regular weight) from the Phosphor core repo, e.g.
//      https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/<name>.svg
//   2. Save it as public/icons/<name>.svg (viewBox 0 0 256 256, single <path>).
//   3. Copy its <path d="..."/> into the ICONS map below, keyed by <name>.
//
// Usage: icon("caret-right") -> inline <svg>; icon("caret-right", "my-class")
// adds "my-class" alongside the base ".ph-icon" class.

const ICONS = {
  "caret-right": '<path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>',
  "caret-down": '<path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>',
};

export function icon(name, extraClass = "") {
  const path = ICONS[name];
  if (!path) throw new Error(`icon(): unknown icon "${name}"`);
  const cls = extraClass ? `ph-icon ${extraClass}` : "ph-icon";
  return `<svg class="${cls}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${path}</svg>`;
}
