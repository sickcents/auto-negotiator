import { haversineKm, type LatLng } from "./distance.js";
import type { HardwareType } from "./sites.js";

// Shape read back from the `sites` table (lib/schema.sql).
export interface DonorRankingSite extends LatLng {
  id: string;
  currentScanners: number;
  currentPrinters: number;
  operatingThresholdScanners: number;
  operatingThresholdPrinters: number;
}

export interface DonorCandidate {
  siteId: string;
  distanceKm: number;
  surplus: number;
}

function currentStock(site: DonorRankingSite, hardwareType: HardwareType): number {
  return hardwareType === "scanner" ? site.currentScanners : site.currentPrinters;
}

function operatingThreshold(site: DonorRankingSite, hardwareType: HardwareType): number {
  return hardwareType === "scanner"
    ? site.operatingThresholdScanners
    : site.operatingThresholdPrinters;
}

// Uber-dispatch style: every site is a candidate regardless of Site Type
// (design-session Q7). A site qualifies if donating the requested quantity
// wouldn't drop it below its own operating_threshold (CONTEXT.md "Donor
// eligibility"). Ranked by surplus-after-donation eligibility, then by
// proximity — same function serves the initial search and every Concession
// Protocol re-run (Q8), just with `excludeSiteIds` grown by one each time.
export function rankDonors(params: {
  sites: readonly DonorRankingSite[];
  receiverSite: LatLng;
  receiverSiteId: string;
  hardwareType: HardwareType;
  quantity: number;
  excludeSiteIds: readonly string[];
}): DonorCandidate[] {
  const { sites, receiverSite, receiverSiteId, hardwareType, quantity, excludeSiteIds } = params;
  const excluded = new Set([receiverSiteId, ...excludeSiteIds]);

  return sites
    .filter((site) => !excluded.has(site.id))
    .map((site) => ({
      siteId: site.id,
      distanceKm: haversineKm(receiverSite, site),
      surplus: currentStock(site, hardwareType) - quantity - operatingThreshold(site, hardwareType),
    }))
    .filter((candidate) => candidate.surplus >= 0)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
