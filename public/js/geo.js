// Client mirror of the backend's distance/ETA math, for map labels only —
// the server remains the source of truth for anything persisted.
//
// haversineKm mirrors lib/domain/distance.ts (ADR-0003: real MRT waypoint
// coordinates drive donor ranking); courierEtaMinutes mirrors the formula in
// lib/tools/logisticsApi.ts (25 km/h average courier speed + 10 min dispatch
// buffer). Keep both in sync with their backend counterparts.

const EARTH_RADIUS_KM = 6371;
const AVERAGE_COURIER_SPEED_KMH = 25;
const DISPATCH_BUFFER_MINUTES = 10;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function courierEtaMinutes(distanceKm) {
  return Math.round((distanceKm / AVERAGE_COURIER_SPEED_KMH) * 60 + DISPATCH_BUFFER_MINUTES);
}
