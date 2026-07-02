import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTransfer, getMessages, getAgentSteps } from "../../../lib/domain/transferRepo.js";

// GET /api/transfers/:id — Transfer detail + message history + Agent
// Console log lines (PRD Section 7/8), polled by the frontend (Q14/Q18).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid transfer id" });

  const transfer = await getTransfer(id);
  if (!transfer) return res.status(404).json({ error: "Transfer not found" });

  const [messages, agentSteps] = await Promise.all([getMessages(id), getAgentSteps(id)]);
  res.status(200).json({ transfer, messages, agentSteps });
}
