// MapPanel — the signature element. Per ADR-0003, Site coordinates are real
// Eastern Singapore MRT stations that already drive the backend's haversine
// distance logic, so the map renders that geography literally on real
// OpenStreetMap tiles (via Leaflet, loaded from CDN in index.html) instead
// of the old hand-rolled SVG projection.

import { ACTIVE_ROUTE_STATUSES } from "../format.js";

const MARKER_SIZE = [40, 20];
const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

let map = null;
let markerLayer = null;
let routeLayer = null;

export function renderMap(sites, transfers = [], selectedTransferId = null) {
  if (sites.length === 0) return;
  ensureMap(sites);

  markerLayer.clearLayers();
  routeLayer.clearLayers();

  const bySiteId = new Map(sites.map((s) => [s.id, s]));

  transfers
    .filter(
      (t) =>
        t.donorSiteId &&
        ACTIVE_ROUTE_STATUSES.has(t.status) &&
        bySiteId.has(t.donorSiteId) &&
        bySiteId.has(t.receiverSiteId)
    )
    .forEach((t) => {
      const donor = bySiteId.get(t.donorSiteId);
      const receiver = bySiteId.get(t.receiverSiteId);
      const selected = t.id === selectedTransferId;
      L.polyline(curvedLatLngs(donor, receiver), {
        className: selected ? "map-route map-route--selected" : "map-route",
        interactive: false,
      }).addTo(routeLayer);
    });

  sites.forEach((site) => {
    L.marker([site.lat, site.lng], { icon: siteIcon(site) })
      .bindTooltip(siteTooltipHtml(site), { className: "map-tooltip", direction: "top", offset: [0, -10] })
      .addTo(markerLayer);
  });
}

// The old manual pointer-event delegation for a hand-positioned tooltip div
// is gone — each marker now binds its own Leaflet tooltip in renderMap.
// Kept exported (as a no-op) so main.js's call site doesn't need to change.
export function initMapTooltip() {}

function ensureMap(sites) {
  if (map) return map;

  // Default topleft zoom control would sit underneath the floating Network
  // Status panel (docked to the full left edge) — bottomright stays clear
  // of both floating panels in the dashboard shell (#3).
  map = L.map("map", { attributionControl: true, zoomControl: false }).fitBounds(
    L.latLngBounds(sites.map((s) => [s.lat, s.lng])).pad(0.25)
  );
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);
  return map;
}

function siteIcon(site) {
  return L.divIcon({
    className: "map-marker-icon",
    html: `<span class="map-marker map-marker--${site.siteType}">[${site.siteType}]</span>`,
    iconSize: MARKER_SIZE,
    iconAnchor: [MARKER_SIZE[0] / 2, MARKER_SIZE[1] / 2],
  });
}

function siteTooltipHtml(site) {
  return `
    <div class="map-tooltip__title">${site.name} · ${site.siteType}</div>
    <div class="map-tooltip__row">Scanners ${site.currentScanners}/${site.operatingThresholdScanners} · Printers ${site.currentPrinters}/${site.operatingThresholdPrinters}</div>`;
}

// Perpendicular-bow quadratic bezier sampled into a polyline — the same
// hand-traced, orbiting-arc feel as the old SVG route, just in lat/lng
// space so it bows relative to real donor/receiver distance.
function curvedLatLngs(donor, receiver) {
  const dLat = receiver.lat - donor.lat;
  const dLng = receiver.lng - donor.lng;
  const len = Math.hypot(dLat, dLng) || 1;
  const bow = Math.min(0.006, len * 0.22);
  const cLat = (donor.lat + receiver.lat) / 2 + (-dLng / len) * bow;
  const cLng = (donor.lng + receiver.lng) / 2 + (dLat / len) * bow;

  const steps = 24;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const it = 1 - t;
    points.push([
      it * it * donor.lat + 2 * it * t * cLat + t * t * receiver.lat,
      it * it * donor.lng + 2 * it * t * cLng + t * t * receiver.lng,
    ]);
  }
  return points;
}
