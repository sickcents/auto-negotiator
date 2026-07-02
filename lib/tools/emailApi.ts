import { z } from "zod";
import { defineTool } from "./types.js";
import { sql } from "../db.js";

// PRD Section 5 "Email API" — writes/reads rows in an in-app mailbox table
// (ADR-0001). Nothing leaves the app; the dashboard renders this table
// directly. The "manager" side of a thread is written by the Manager Reply
// Injection endpoint (design-session Q2), not by this tool.

export const sendEmailTool = defineTool({
  name: "send_email",
  description:
    "Draft and send an email as the agent, appended to this Transfer's message history. `stage` tells the orchestrator what kind of email this is so it can update the Transfer's status correctly: 'initial' (first donor request), 'firmness_lock' (Firmness Protocol reply — locks the transfer), or 'escalation' (deadlock summary addressed to the Regional Director).",
  argsSchema: z.object({
    transferId: z.number().int(),
    body: z.string().min(1),
    stage: z.enum(["initial", "firmness_lock", "escalation"]).default("initial"),
  }),
  execute: async ({ transferId, body }) => {
    const rows = await sql(
      `INSERT INTO messages (transfer_id, sender, body) VALUES ($1, 'agent', $2) RETURNING id, created_at`,
      [transferId, body]
    );
    return { messageId: rows[0]?.id, sentAt: rows[0]?.created_at };
  },
});

export const readMessagesTool = defineTool({
  name: "read_transfer_messages",
  description: "Read the full email/reply history for this Transfer, oldest first.",
  argsSchema: z.object({ transferId: z.number().int() }),
  execute: async ({ transferId }) => {
    const rows = await sql(
      `SELECT sender, body, created_at FROM messages WHERE transfer_id = $1 ORDER BY created_at ASC`,
      [transferId]
    );
    return { messages: rows };
  },
});
