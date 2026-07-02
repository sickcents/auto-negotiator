// MapPanel — the signature element. Reuses DESIGN.md's "orbital arc between
// circular portraits" motif, but the arc is no longer decorative: it *is*
// the donor -> receiver route for whichever Transfer(s) are currently open,
// same as the haversine ranking the backend actually runs (PRD Section 7).

import { ACTIVE_ROUTE_STATUSES } from "../format.js";

const VIEW = 400;
const PAD = 34;
const MARKER_RADIUS = { XL: 9, L: 7.5, M: 6.5, S: 5.5 };

export function renderMap(sites, transfers = [], selectedTransferId = null) {
  const svg = document.getElementById("map");
  if (sites.length === 0) return;

  const project = makeProjector(sites);
  const bySiteId = new Map(sites.map((s) => [s.id, s]));

  const routes = transfers
    .filter(
      (t) =>
        t.donorSiteId &&
        ACTIVE_ROUTE_STATUSES.has(t.status) &&
        bySiteId.has(t.donorSiteId) &&
        bySiteId.has(t.receiverSiteId)
    )
    .map((t) => routeArcHtml(project(bySiteId.get(t.donorSiteId)), project(bySiteId.get(t.receiverSiteId)), t.id === selectedTransferId))
    .join("");

  const markers = sites.map((site) => siteMarkerHtml(site, project(site))).join("");

  svg.innerHTML = `<g>${routes}</g><g>${markers}</g>`;
}

// Wire hover once — markers are re-rendered often, but this listens on the
// stable <svg> parent via delegation rather than re-binding per marker.
export function initMapTooltip() {
  const frame = document.getElementById("map-frame");
  const svg = document.getElementById("map");
  const tooltip = document.getElementById("map-tooltip");

  svg.addEventListener("pointerover", (event) => {
    const marker = event.target.closest(".map-site");
    if (!marker) return;
    const data = JSON.parse(decodeURIComponent(marker.dataset.site));
    const frameRect = frame.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    tooltip.style.left = `${markerRect.left + markerRect.width / 2 - frameRect.left}px`;
    tooltip.style.top = `${markerRect.top - frameRect.top}px`;
    tooltip.innerHTML = `
      <div class="map-tooltip__title">${data.name} · ${data.siteType}</div>
      <div class="map-tooltip__row">Scanners ${data.scanners} · Printers ${data.printers}</div>`;
    tooltip.hidden = false;
  });

  svg.addEventListener("pointerout", (event) => {
    if (event.target.closest(".map-site")) tooltip.hidden = true;
  });
}

function makeProjector(sites) {
  const lats = sites.map((s) => s.lat);
  const lngs = sites.map((s) => s.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  return (site) => ({
    x: PAD + ((site.lng - minLng) / (maxLng - minLng || 1)) * (VIEW - 2 * PAD),
    // Flip Y: higher latitude = further "up" on screen.
    y: VIEW - PAD - ((site.lat - minLat) / (maxLat - minLat || 1)) * (VIEW - 2 * PAD),
  });
}

function siteMarkerHtml(site, { x, y }) {
  const r = MARKER_RADIUS[site.siteType] ?? 6;
  const payload = encodeURIComponent(
    JSON.stringify({
      name: site.name,
      siteType: site.siteType,
      scanners: `${site.currentScanners}/${site.operatingThresholdScanners}`,
      printers: `${site.currentPrinters}/${site.operatingThresholdPrinters}`,
    })
  );
  return `<g class="map-site" data-site="${payload}" transform="translate(${x},${y})">
    <circle r="${r}" style="fill: var(--color-site-${site.siteType.toLowerCase()})"></circle>
    <text x="${r + 5}" y="3">${site.name}</text>
  </g>`;
}

function routeArcHtml(a, b, selected) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular bow gives the path its hand-traced, orbiting feel
  // instead of a perfectly straight CSS line.
  const bow = Math.min(40, len * 0.22);
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;
  const cls = selected ? "map-route map-route--selected" : "map-route";
  return `<path class="${cls}" d="M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}"></path>`;
}
