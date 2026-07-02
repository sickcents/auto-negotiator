import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTransfer, addManagerMessage, setTransferStatus } from "../../../lib/domain/transferRepo.js";

// POST /api/transfers/:id/reply — Manager Reply Injection (design-session
// Q2): body is either free text or a preset string; both go through this
// one path, no special-cased demo branch (ADR-0001).
//
// This endpoint deliberately doesn't try to classify the reply itself
// (agreement vs. rejection vs. a Concession claim) — that's the agent's
// own job on its next turn (PRD Section 8 step 4), including the
// Escalation Protocol's pushback count (see agentStep.ts/transferRepo.ts
// hasSentFirmnessLock/recordFirmnessPushback). Guessing here from status
// alone previously deadlocked Transfers on an *agreeing* reply just
// because one had arrived while status was "locked".
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid transfer id" });

  const { body } = req.body ?? {};
  if (typeof body !== "string" || body.trim().length === 0) {
    return res.status(400).json({ error: "body (string) is required" });
  }

  const transfer = await getTransfer(id);
  if (!transfer) return res.status(404).json({ error: "Transfer not found" });

  // Only a Transfer actually waiting on this reply can accept one — a
  // deadlocked/errored/in-transit/completed Transfer must go through
  // Regional Director Override instead, never silently reopen (CONTEXT.md:
  // "Deadlock ... never resolves back to Concession/Firmness on its own").
  if (transfer.status !== "awaiting_reply" && transfer.status !== "locked") {
    return res.status(409).json({ error: `Transfer is "${transfer.status}"; not awaiting a manager reply` });
  }

  await addManagerMessage(id, body);
  await setTransferStatus(id, "sourcing"); // give the agent a turn to interpret this reply

  res.status(200).json({ status: "sourcing" });
}
