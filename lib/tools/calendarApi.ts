import { z } from "zod";
import { defineTool } from "./types.js";
import { sql } from "../db.js";

// PRD Section 5 "Calendar API" — seeded promo/foot-traffic events, used by
// the Concession Protocol (PRD Section 6) to verify or refute a manager's
// claim like "huge promo tomorrow."

export const checkPromotionScheduleTool = defineTool({
  name: "check_promotion_schedule",
  description:
    "Check whether a site has a seeded promo or peak-foot-traffic event on or near a given date (YYYY-MM-DD). Use this to verify a manager's Concession Protocol claim before conceding.",
  argsSchema: z.object({
    siteId: z.string(),
    aroundDate: z.string().describe("ISO date, e.g. today or tomorrow's date"),
  }),
  execute: async ({ siteId, aroundDate }) => {
    const rows = await sql(
      `SELECT event_date, description, peak_traffic FROM calendar_events
       WHERE site_id = $1 AND event_date BETWEEN $2::date - INTERVAL '1 day' AND $2::date + INTERVAL '1 day'`,
      [siteId, aroundDate]
    );
    return { verified: rows.length > 0, events: rows };
  },
});
