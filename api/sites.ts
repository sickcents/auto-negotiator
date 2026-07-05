import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllSites, getAllTrailingDepletion } from "../lib/domain/siteRepo.js";
import { computeMinBuffer, computeDepletionRate } from "../lib/domain/thresholds.js";
import { completeArrivedTransfers } from "../lib/domain/monitor.js";
import { withErrorHandling } from "../lib/http.js";

// GET /api/sites — backs the Map View + Network Status View (PRD Section 7).
export default withErrorHandling(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  await completeArrivedTransfers(); // lazy arrival check (#43) — no cron/background process, ADR-0002
  const sites = await getAllSites();
  const depletionBySite = await getAllTrailingDepletion();

  const withThresholds = sites.map((site) => {
    const history = depletionBySite.get(site.id) ?? { scanner: [], printer: [] };
    return {
      ...site,
      scannerMinBuffer: computeMinBuffer(history.scanner),
      scannerDepletionRate: computeDepletionRate(history.scanner),
      printerMinBuffer: computeMinBuffer(history.printer),
      printerDepletionRate: computeDepletionRate(history.printer),
    };
  });

  res.status(200).json({ sites: withThresholds });
});
