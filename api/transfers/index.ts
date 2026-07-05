import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listTransfers } from "../../lib/domain/transferRepo.js";
import { withErrorHandling } from "../../lib/http.js";

// GET /api/transfers — list, newest first.
export default withErrorHandling(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const transfers = await listTransfers();
  res.status(200).json({ transfers });
});
