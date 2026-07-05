import { z } from "zod";
import { defineTool } from "./types.js";
import { getSite } from "../domain/siteRepo.js";
import { recordDispatch } from "../domain/transferRepo.js";
import { haversineKm } from "../domain/distance.js";

// PRD Section 5 "Logistics API" — logs a synthetic courier confirmation, no
// real courier is contacted (ADR-0001). Stock no longer moves here (#43) —
// this only stamps dispatch/arrival timing; the donor/receiver counts move
// once the Transfer's simulated arrival time actually elapses (see
// completeArrivedTransfers in lib/domain/monitor.ts).

const AVERAGE_COURIER_SPEED_KMH = 25;
const DISPATCH_BUFFER_MINUTES = 10;
const ARRIVAL_JITTER_SECONDS = 3 * 60;
const COURIERS = ["Lalamove", "GrabExpress"] as const;

export const dispatchCourierTool = defineTool({
  name: "dispatch_courier",
  description:
    "Dispatch a courier to move hardware from the donor site to the receiver site once the negotiation is agreed. Starts the transit window and returns a synthetic confirmation with an ETA; the donor/receiver stock updates once the courier actually arrives.",
  argsSchema: z.object({
    transferId: z.number().int(),
    fromSiteId: z.string(),
    toSiteId: z.string(),
    hardwareType: z.enum(["scanner", "printer"]),
    quantity: z.number().int().positive(),
  }),
  execute: async ({ transferId, fromSiteId, toSiteId, hardwareType, quantity }) => {
    const [fromSite, toSite] = await Promise.all([getSite(fromSiteId), getSite(toSiteId)]);
    if (!fromSite || !toSite) return { error: "Unknown donor or receiver site" };

    const distanceKm = haversineKm(fromSite, toSite);
    const etaMinutes = Math.round((distanceKm / AVERAGE_COURIER_SPEED_KMH) * 60 + DISPATCH_BUFFER_MINUTES);
    const courier = COURIERS[Math.abs(fromSiteId.length - toSiteId.length) % COURIERS.length] ?? COURIERS[0];

    // Fixed once at dispatch time, not re-rolled on later reads.
    const jitterSeconds = Math.random() * 2 * ARRIVAL_JITTER_SECONDS - ARRIVAL_JITTER_SECONDS;
    const { dispatchedAt, estimatedArrivalAt } = await recordDispatch(transferId, etaMinutes * 60 + jitterSeconds);

    return {
      confirmationId: `${courier.toUpperCase()}-${Date.now()}`,
      courier,
      distanceKm: Math.round(distanceKm * 10) / 10,
      etaMinutes,
      dispatchedAt,
      estimatedArrivalAt,
    };
  },
});
