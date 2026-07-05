// MapPanel — the signature element. Per ADR-0003, Site coordinates are real
// Eastern Singapore MRT stations that already drive the backend's haversine
// distance logic, so the map renders that geography literally on real
// OpenStreetMap tiles (via Leaflet, loaded from CDN in index.html) instead
// of the old hand-rolled SVG projection.

import { ACTIVE_ROUTE_STATUSES } from "../format.js";
import { icon } from "../icons.js";
import { haversineKm, courierEtaMinutes } from "../geo.js";

const MARKER_SIZE = [40, 20];
const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const COURIER_LOOP_MS = 6000; // one donor->receiver sweep of the direction indicator

let map = null;
let markerLayer = null;
let routeLayer = null;
let courierAnimationFrame = null;

export function renderMap(sites, transfers = [], selectedTransferId = null, activeSiteTypes = null, selectedSiteId = null) {
  if (sites.length === 0) return;
  ensureMap(sites);

  stopCourierAnimation();
  markerLayer.clearLayers();
  routeLayer.clearLayers();

  const bySiteId = new Map(sites.map((s) => [s.id, s]));

  // The selected transfer's endpoints get highlighted markers (#13), so the
  // projected move reads as "from this site, to this site" — not just a line.
  const selected = transfers.find(
    (t) =>
      t.id === selectedTransferId &&
      t.donorSiteId &&
      ACTIVE_ROUTE_STATUSES.has(t.status) &&
      bySiteId.has(t.donorSiteId) &&
      bySiteId.has(t.receiverSiteId)
  );

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
      const isSelected = t.id === selectedTransferId;
      L.polyline(curvedLatLngs(donor, receiver), {
        className: isSelected ? "map-route map-route--selected" : "map-route",
        interactive: false,
      }).addTo(routeLayer);
    });

  if (selected) {
    renderSelectedRouteExtras(bySiteId.get(selected.donorSiteId), bySiteId.get(selected.receiverSiteId));
  }

  const visibleSites = activeSiteTypes ? sites.filter((s) => activeSiteTypes.has(s.siteType)) : sites;
  visibleSites.forEach((site) => {
    const role =
      selected && site.id === selected.donorSiteId
        ? "donor"
        : selected && site.id === selected.receiverSiteId
          ? "receiver"
          : null;
    const isCardSelected = site.id === selectedSiteId;
    L.marker([site.lat, site.lng], {
      icon: siteIcon(site, role, isCardSelected),
      zIndexOffset: role || isCardSelected ? 1000 : 0,
    })
      .bindTooltip(siteTooltipHtml(site), { className: "map-tooltip", direction: "top", offset: [0, -10] })
      .addTo(markerLayer);
  });
}

// Pans (without changing zoom) to a card-selected site (#19). A one-shot
// call from main.js on selection, not baked into every renderMap re-render
// — otherwise every poll tick would recenter the map out from under a user
// who has since panned elsewhere.
export function panToSite(site) {
  if (!map || !site) return;
  map.panTo([site.lat, site.lng]);
}

// Direction + magnitude for the selected route (#13): a Phosphor courier
// truck sweeps donor -> receiver along the arc on a loop (the motion itself
// is the direction indicator), and the arc midpoint carries the same
// haversine distance / courier ETA the backend uses for donor ranking and
// dispatch confirmations (client mirror in geo.js).
function renderSelectedRouteExtras(donor, receiver) {
  const points = curvedLatLngs(donor, receiver);

  const distanceKm = haversineKm(donor, receiver);
  const mid = points[Math.floor(points.length / 2)];
  L.marker(mid, {
    icon: L.divIcon({
      className: "map-anno-icon",
      html: `<span class="map-route-label">${distanceKm.toFixed(1)} km · ~${courierEtaMinutes(distanceKm)} min</span>`,
      iconSize: [0, 0],
    }),
    interactive: false,
  }).addTo(routeLayer);

  const courier = L.marker(points[0], {
    icon: L.divIcon({
      className: "map-anno-icon",
      html: `<span class="map-courier">${icon("truck", "map-courier__icon")}</span>`,
      iconSize: [0, 0],
    }),
    interactive: false,
  }).addTo(routeLayer);

  // Phase derives from absolute time, so the sweep stays continuous across
  // the frequent full re-renders the poll loop triggers.
  const step = (now) => {
    const t = (now % COURIER_LOOP_MS) / COURIER_LOOP_MS;
    const scaled = t * (points.length - 1);
    const i = Math.min(Math.floor(scaled), points.length - 2);
    const frac = scaled - i;
    courier.setLatLng([
      points[i][0] + (points[i + 1][0] - points[i][0]) * frac,
      points[i][1] + (points[i + 1][1] - points[i][1]) * frac,
    ]);
    courierAnimationFrame = requestAnimationFrame(step);
  };
  courierAnimationFrame = requestAnimationFrame(step);
}

function stopCourierAnimation() {
  if (courierAnimationFrame != null) {
    cancelAnimationFrame(courierAnimationFrame);
    courierAnimationFrame = null;
  }
}

// The old manual pointer-event delegation for a hand-positioned tooltip div
// is gone — each marker now binds its own Leaflet tooltip in renderMap.
// Kept exported (as a no-op) so main.js's call site doesn't need to change.
export function initMapTooltip() {}

function ensureMap(sites) {
  if (map) return map;

  // Since #12 the map is a full-bleed background with panels floating over
  // it: the transfers rail owns the left edge and the Network/Sim side-rail
  // owns the top-right (capped short of the bottom). bottomright keeps the
  // zoom control and OSM attribution clear of every panel.
  map = L.map("map", { attributionControl: true, zoomControl: false }).fitBounds(
    L.latLngBounds(sites.map((s) => [s.lat, s.lng])).pad(0.25)
  );
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);
  return map;
}

function siteIcon(site, role = null, isCardSelected = false) {
  const roleClass = role ? ` map-marker--${role}` : "";
  // Card selection is a separate outline ring (#19), independent of the
  // donor/receiver role classes above, so both states can be visible on the
  // same marker at once without one overwriting the other's treatment.
  const selectedClass = isCardSelected ? " map-marker--card-selected" : "";
  return L.divIcon({
    className: "map-marker-icon",
    html: `<span class="map-marker map-marker--${site.siteType}${roleClass}${selectedClass}">${site.siteType}</span>`,
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
