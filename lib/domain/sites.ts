// Static network data — PRD Section 3 "The Operating Environment".
// Treat as a seed dataset (as the PRD says): adjust freely.

export type SiteType = "XL" | "L" | "M" | "S";
export type HardwareType = "scanner" | "printer";

export interface SiteTypeConfig {
  networkRole: string; // descriptive default only — CONTEXT.md "Network Role"
  maxScanners: number;
  maxPrinters: number;
  operatingThresholdScanners: number;
  operatingThresholdPrinters: number;
  // Leading-indicator ceiling on daily depletion rate (PRD Section 4 critical_threshold),
  // independent of current stock level.
  criticalDepletionRateScanners: number;
  criticalDepletionRatePrinters: number;
}

export const SITE_TYPE_CONFIG: Record<SiteType, SiteTypeConfig> = {
  XL: {
    networkRole: "Regional Hub & Repair",
    maxScanners: 50,
    maxPrinters: 20,
    operatingThresholdScanners: 15,
    operatingThresholdPrinters: 6,
    criticalDepletionRateScanners: 10,
    criticalDepletionRatePrinters: 4,
  },
  L: {
    networkRole: "High-Traffic Donor",
    maxScanners: 20,
    maxPrinters: 10,
    operatingThresholdScanners: 6,
    operatingThresholdPrinters: 3,
    criticalDepletionRateScanners: 4,
    criticalDepletionRatePrinters: 2,
  },
  M: {
    networkRole: "Standard Donor/Receiver",
    maxScanners: 10,
    maxPrinters: 5,
    operatingThresholdScanners: 3,
    operatingThresholdPrinters: 1,
    criticalDepletionRateScanners: 2,
    criticalDepletionRatePrinters: 1,
  },
  S: {
    networkRole: "Express Receiver",
    maxScanners: 5,
    maxPrinters: 2,
    operatingThresholdScanners: 1,
    operatingThresholdPrinters: 1,
    criticalDepletionRateScanners: 1,
    criticalDepletionRatePrinters: 1,
  },
};

export interface SiteSeed {
  id: string;
  name: string;
  siteType: SiteType;
  mrtWaypoint: string;
  lat: number;
  lng: number;
}

// 13 stores (1 XL, 3 L, 4 M, 5 S), pinned to real Eastern Singapore MRT
// stations (ADR-0003) — enough variety for donor ranking to have real
// candidates to choose between (Q4/Q5 in the design session).
export const SITES: readonly SiteSeed[] = [
  { id: "tampines-hub", name: "Tampines Hub", siteType: "XL", mrtWaypoint: "Tampines", lat: 1.3546, lng: 103.9437 },
  { id: "bedok-central", name: "Bedok Central", siteType: "L", mrtWaypoint: "Bedok", lat: 1.3236, lng: 103.9273 },
  { id: "simei-point", name: "Simei Point", siteType: "L", mrtWaypoint: "Simei", lat: 1.3431, lng: 103.9532 },
  { id: "paya-lebar-square", name: "Paya Lebar Square", siteType: "L", mrtWaypoint: "Paya Lebar", lat: 1.3180, lng: 103.8925 },
  { id: "pasir-ris-drive", name: "Pasir Ris Drive", siteType: "M", mrtWaypoint: "Pasir Ris", lat: 1.3721, lng: 103.9493 },
  { id: "tanah-merah-walk", name: "Tanah Merah Walk", siteType: "M", mrtWaypoint: "Tanah Merah", lat: 1.3272, lng: 103.9463 },
  { id: "kembangan-court", name: "Kembangan Court", siteType: "M", mrtWaypoint: "Kembangan", lat: 1.3208, lng: 103.9127 },
  { id: "bedok-north-ave", name: "Bedok North Ave", siteType: "M", mrtWaypoint: "Bedok North", lat: 1.3348, lng: 103.9186 },
  { id: "eunos-crescent", name: "Eunos Crescent", siteType: "S", mrtWaypoint: "Eunos", lat: 1.3197, lng: 103.9030 },
  { id: "aljunied-road", name: "Aljunied Road", siteType: "S", mrtWaypoint: "Aljunied", lat: 1.3164, lng: 103.8828 },
  { id: "expo-way", name: "Expo Way", siteType: "S", mrtWaypoint: "Expo", lat: 1.3352, lng: 103.9613 },
  { id: "upper-changi", name: "Upper Changi", siteType: "S", mrtWaypoint: "Upper Changi", lat: 1.3412, lng: 103.9614 },
  { id: "bedok-reservoir", name: "Bedok Reservoir", siteType: "S", mrtWaypoint: "Bedok Reservoir", lat: 1.3363, lng: 103.9330 },
];
