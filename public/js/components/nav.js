import { ACTIVE_ROUTE_STATUSES } from "../format.js";

// "Active" here means "not yet completed" (any status in
// ACTIVE_ROUTE_STATUSES, including in_transit) — not "physically moving
// between donor and receiver." Worth spelling out now that in_transit (#43)
// is a real elapsed-time window rather than flashing by in one agent turn,
// so a Transfer can sit as "active" for a while without a courier literally
// being en route (e.g. still sourcing/negotiating a donor).
export function renderNavStatus(sites, transfers) {
  const active = transfers.filter((t) => ACTIVE_ROUTE_STATUSES.has(t.status)).length;
  const el = document.getElementById("nav-status");
  el.textContent = `${sites.length} sites · ${active} active transfer${active === 1 ? "" : "s"}`;
  el.title = "Active = not yet completed (sourcing, negotiating, in transit, deadlocked, or errored)";
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
