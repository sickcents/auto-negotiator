import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setStock } from "../lib/domain/siteRepo.js";
import { checkThresholdsAndMaybeCreateTransfer } from "../lib/domain/monitor.js";
import { withErrorHandling } from "../lib/http.js";

// POST /api/simulate-incident — PRD Section 7 "Simulate Incident" control.
// Drops a site's stock below its operating_threshold, then runs the same
// inline threshold check any real mutation would (ADR-0002/PRD Section 4).
export default withErrorHandling(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { siteId, hardwareType, dropTo } = req.body ?? {};
  if (!siteId || (hardwareType !== "scanner" && hardwareType !== "printer")) {
    return res.status(400).json({ error: "siteId and hardwareType ('scanner'|'printer') are required" });
  }

  const targetStock = typeof dropTo === "number" ? dropTo : 0;
  await setStock(siteId, hardwareType, targetStock);

  const transfer = await checkThresholdsAndMaybeCreateTransfer(siteId, hardwareType);
  res.status(200).json({ transfer });
});
