import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllSites, getTrailingDepletion } from "../lib/domain/siteRepo.js";
import { computeMinBuffer, computeDepletionRate } from "../lib/domain/thresholds.js";

// GET /api/sites — backs the Map View + Network Status View (PRD Section 7).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const sites = await getAllSites();
  const withThresholds = await Promise.all(
    sites.map(async (site) => {
      const scannerHistory = await getTrailingDepletion(site.id, "scanner");
      const printerHistory = await getTrailingDepletion(site.id, "printer");
      return {
        ...site,
        scannerMinBuffer: computeMinBuffer(scannerHistory),
        scannerDepletionRate: computeDepletionRate(scannerHistory),
        printerMinBuffer: computeMinBuffer(printerHistory),
        printerDepletionRate: computeDepletionRate(printerHistory),
      };
    })
  );

  res.status(200).json({ sites: withThresholds });
}
