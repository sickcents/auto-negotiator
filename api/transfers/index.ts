import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listTransfers } from "../../lib/domain/transferRepo.js";
import { completeArrivedTransfers } from "../../lib/domain/monitor.js";
import { withErrorHandling } from "../../lib/http.js";

// GET /api/transfers — list, newest first.
export default withErrorHandling(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  await completeArrivedTransfers(); // lazy arrival check (#43) — no cron/background process, ADR-0002
  const transfers = await listTransfers();
  res.status(200).json({ transfers });
});
