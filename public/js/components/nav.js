import { ACTIVE_ROUTE_STATUSES } from "../format.js";

export function renderNavStatus(sites, transfers) {
  const active = transfers.filter((t) => ACTIVE_ROUTE_STATUSES.has(t.status)).length;
  document.getElementById("nav-status").textContent = `${sites.length} sites · ${active} active transfer${active === 1 ? "" : "s"}`;
}
