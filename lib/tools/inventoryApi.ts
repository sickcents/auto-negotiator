import { z } from "zod";
import { defineTool } from "./types.js";
import { getAllSites, getSite, getTrailingDepletion } from "../domain/siteRepo.js";
import { computeMinBuffer, computeDepletionRate } from "../domain/thresholds.js";
import { rankDonors, type DonorRankingSite } from "../domain/donorRanking.js";

// PRD Section 5 "Inventory API" — query real-time stock/trends and rank
// donor candidates by real haversine distance (ADR-0003), not a hand-
// assigned tier.

export const queryInventoryTool = defineTool({
  name: "query_inventory",
  description:
    "Get a site's current stock, static operating_threshold, and dynamic min_buffer/depletion_rate for both hardware types.",
  argsSchema: z.object({ siteId: z.string() }),
  execute: async ({ siteId }) => {
    const site = await getSite(siteId);
    if (!site) return { error: `No such site: ${siteId}` };

    const scannerHistory = await getTrailingDepletion(siteId, "scanner");
    const printerHistory = await getTrailingDepletion(siteId, "printer");

    return {
      site,
      scanners: {
        current: site.currentScanners,
        operatingThreshold: site.operatingThresholdScanners,
        minBuffer: computeMinBuffer(scannerHistory),
        depletionRate: computeDepletionRate(scannerHistory),
      },
      printers: {
        current: site.currentPrinters,
        operatingThreshold: site.operatingThresholdPrinters,
        minBuffer: computeMinBuffer(printerHistory),
        depletionRate: computeDepletionRate(printerHistory),
      },
    };
  },
});

export const rankDonorsTool = defineTool({
  name: "rank_donors",
  description:
    "Rank candidate donor sites for a hardware transfer by eligibility (won't drop the donor below its own operating_threshold) then by proximity. Uber-dispatch style: every site is a candidate, no Site Type is excluded.",
  argsSchema: z.object({
    receiverSiteId: z.string(),
    hardwareType: z.enum(["scanner", "printer"]),
    quantity: z.number().int().positive(),
    excludeSiteIds: z.array(z.string()).default([]),
  }),
  execute: async ({ receiverSiteId, hardwareType, quantity, excludeSiteIds }) => {
    const receiverSite = await getSite(receiverSiteId);
    if (!receiverSite) return { error: `No such site: ${receiverSiteId}` };

    const allSites: DonorRankingSite[] = await getAllSites();
    const candidates = rankDonors({
      sites: allSites,
      receiverSite,
      receiverSiteId,
      hardwareType,
      quantity,
      excludeSiteIds,
    });

    return { candidates };
  },
});
