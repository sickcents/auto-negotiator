import { z } from "zod";
import { defineTool } from "./types.js";
import { sql } from "../db.js";

// PRD Section 5 "ITSM API" — open/close service tickets in-app for audit
// trails. One ticket per Transfer for its whole lifecycle (CONTEXT.md).

export const openTicketTool = defineTool({
  name: "open_ticket",
  description: "Open the ITSM ticket for this Transfer. Call this once, at the start of the workflow.",
  argsSchema: z.object({ transferId: z.number().int() }),
  execute: async ({ transferId }) => {
    const rows = await sql(
      `INSERT INTO tickets (transfer_id) VALUES ($1)
       ON CONFLICT (transfer_id) DO NOTHING
       RETURNING id, opened_at`,
      [transferId]
    );
    return rows[0] ?? { alreadyOpen: true };
  },
});

export const closeTicketTool = defineTool({
  name: "close_ticket",
  description: "Close the ITSM ticket for this Transfer once logistics is dispatched and the audit is complete.",
  argsSchema: z.object({ transferId: z.number().int() }),
  execute: async ({ transferId }) => {
    const rows = await sql(
      `UPDATE tickets SET status = 'closed', closed_at = now() WHERE transfer_id = $1 RETURNING closed_at`,
      [transferId]
    );
    return rows[0] ?? { error: "No ticket found for this Transfer" };
  },
});
