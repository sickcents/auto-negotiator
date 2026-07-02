import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runAgentStep } from "../../../lib/domain/agentStep.js";

// POST /api/transfers/:id/step — advance exactly one thought->tool_call
// turn (design-session Q17/Q18). The frontend calls this repeatedly as
// part of its short-poll loop until the response status is a
// waiting-on-human state.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid transfer id" });

  const result = await runAgentStep(id);
  res.status(200).json(result);
}
