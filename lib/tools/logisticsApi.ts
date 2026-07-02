import { z } from "zod";
import { defineTool } from "./types.js";
import { getSite, adjustStock } from "../domain/siteRepo.js";
import { haversineKm } from "../domain/distance.js";

// PRD Section 5 "Logistics API" — logs a synthetic courier confirmation, no
// real courier is contacted (ADR-0001). This is also where stock actually
// moves: PRD Section 8 step 6 says inventory becomes "In-Transit" once
// logistics is dispatched, so the donor/receiver counts update here.

const AVERAGE_COURIER_SPEED_KMH = 25;
const DISPATCH_BUFFER_MINUTES = 10;
const COURIERS = ["Lalamove", "GrabExpress"] as const;

export const dispatchCourierTool = defineTool({
  name: "dispatch_courier",
  description:
    "Dispatch a courier to move hardware from the donor site to the receiver site once the negotiation is agreed. Moves the stock (donor decreases, receiver increases) and returns a synthetic confirmation with an ETA.",
  argsSchema: z.object({
    fromSiteId: z.string(),
    toSiteId: z.string(),
    hardwareType: z.enum(["scanner", "printer"]),
    quantity: z.number().int().positive(),
  }),
  execute: async ({ fromSiteId, toSiteId, hardwareType, quantity }) => {
    const [fromSite, toSite] = await Promise.all([getSite(fromSiteId), getSite(toSiteId)]);
    if (!fromSite || !toSite) return { error: "Unknown donor or receiver site" };

    const distanceKm = haversineKm(fromSite, toSite);
    const etaMinutes = Math.round((distanceKm / AVERAGE_COURIER_SPEED_KMH) * 60 + DISPATCH_BUFFER_MINUTES);
    const courier = COURIERS[Math.abs(fromSiteId.length - toSiteId.length) % COURIERS.length] ?? COURIERS[0];

    await adjustStock(fromSiteId, hardwareType, -quantity);
    await adjustStock(toSiteId, hardwareType, quantity);

    return {
      confirmationId: `${courier.toUpperCase()}-${Date.now()}`,
      courier,
      distanceKm: Math.round(distanceKm * 10) / 10,
      etaMinutes,
    };
  },
});
