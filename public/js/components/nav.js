import { ACTIVE_ROUTE_STATUSES } from "../format.js";

export function renderNavStatus(sites, transfers) {
  const active = transfers.filter((t) => ACTIVE_ROUTE_STATUSES.has(t.status)).length;
  document.getElementById("nav-status").textContent = `${sites.length} sites · ${active} active transfer${active === 1 ? "" : "s"}`;
}

// Publishes the header's real rendered height into --nav-height (#21), so
// panels pinned below it (.transfers-strip, .side-rail) clear it exactly
// instead of a hardcoded magic-number offset — including when the header
// wraps to two lines at narrow widths (the brand/status stack, see the
// max-width:599px rule in components.css).
export function initNavHeightTracking() {
  const nav = document.querySelector(".nav-pill");
  if (!nav) return;
  const update = () => {
    document.documentElement.style.setProperty("--nav-height", `${nav.getBoundingClientRect().height}px`);
  };
  // Explicit border-box: the default (content-box) wouldn't fire for a
  // padding/border-only height change, only a content reflow — and the
  // whole point here is to track the bar's real rendered height.
  new ResizeObserver(update).observe(nav, { box: "border-box" });
  update();
}
