import { getSite, getAllSites } from "./siteRepo.js";
import { rankDonors } from "./donorRanking.js";
import { getTransfer, setTransferDonor, setTransferStatus, logAgentStep } from "./transferRepo.js";
import { openTicketTool, closeTicketTool } from "../tools/itsmApi.js";
import { dispatchCourierTool } from "../tools/logisticsApi.js";
import { pushZplConfigTool } from "../tools/zplApi.js";

// PRD Section 6 "Regional Director Override" (design-session Q11/Q12-follow-up):
// a deadlocked/errored Transfer's human resolution path. Deterministic —
// no LLM call, since a human already made the decision. Also computes the
// efficiency cost of an unconstrained manual reroute vs. the top-ranked
// alternative, so overriding isn't shown as free (Q12 follow-up).
export async function resolveOverride(
  transferId: number,
  action: { type: "approve" } | { type: "reroute"; donorSiteId: string }
): Promise<{ status: string; distanceKm?: number; topRankedAlternativeKm?: number }> {
  const transfer = await getTransfer(transferId);
  if (!transfer) throw new Error(`No such Transfer: ${transferId}`);

  let donorSiteId = transfer.donorSiteId;
  let topRankedAlternativeKm: number | undefined;

  if (action.type === "reroute") {
    donorSiteId = action.donorSiteId;
    await setTransferDonor(transferId, donorSiteId);

    const receiverSite = await getSite(transfer.receiverSiteId);
    const allSites = await getAllSites();
    if (receiverSite) {
      const ranked = rankDonors({
        sites: allSites,
        receiverSite,
        receiverSiteId: transfer.receiverSiteId,
        hardwareType: transfer.hardwareType,
        quantity: transfer.quantity,
        excludeSiteIds: transfer.declinedSiteIds,
      });
      topRankedAlternativeKm = ranked[0]?.distanceKm;
    }
  }

  if (!donorSiteId) throw new Error("Cannot resolve override: no donor site set");

  await logAgentStep({
    transferId,
    thought: `Regional Director override: ${action.type === "approve" ? "force-approved current donor" : `force-rerouted to ${donorSiteId}`}.`,
    toolName: "regional_director_override",
    toolArgs: action,
    toolResult: { donorSiteId },
  });

  await openTicketTool.execute({ transferId });
  const dispatchResult = (await dispatchCourierTool.execute({
    transferId,
    fromSiteId: donorSiteId,
    toSiteId: transfer.receiverSiteId,
    hardwareType: transfer.hardwareType,
    quantity: transfer.quantity,
  })) as { distanceKm?: number };
  await pushZplConfigTool.execute({ toSiteId: transfer.receiverSiteId, hardwareType: transfer.hardwareType });
  await closeTicketTool.execute({ transferId });
  // Same as the agent-driven flow (#43): dispatch only starts the transit
  // window. Stock moves and the status flips to completed once
  // estimated_arrival_at actually elapses (the lazy arrival check on the
  // next read), not instantly here — a human override skips negotiation,
  // not the simulated transit time.
  await setTransferStatus(transferId, "in_transit");

  return { status: "in_transit", distanceKm: dispatchResult.distanceKm, topRankedAlternativeKm };
}
