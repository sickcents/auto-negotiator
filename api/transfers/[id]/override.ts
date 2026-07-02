import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveOverride } from "../../../lib/domain/regionalOverride.js";

// POST /api/transfers/:id/override — Regional Director Override (PRD
// Section 6/7, design-session Q11/Q12-followup). body: { action: "approve" }
// or { action: "reroute", donorSiteId }.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid transfer id" });

  const { action, donorSiteId } = req.body ?? {};
  if (action !== "approve" && action !== "reroute") {
    return res.status(400).json({ error: "action must be 'approve' or 'reroute'" });
  }
  if (action === "reroute" && typeof donorSiteId !== "string") {
    return res.status(400).json({ error: "donorSiteId (string) is required for 'reroute'" });
  }

  const result = await resolveOverride(
    id,
    action === "approve" ? { type: "approve" } : { type: "reroute", donorSiteId }
  );
  res.status(200).json(result);
}
