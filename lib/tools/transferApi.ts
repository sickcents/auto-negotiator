import { z } from "zod";
import { defineTool } from "./types.js";
import { setTransferDonor } from "../domain/transferRepo.js";

// Not one of the PRD Section 5 business APIs — this is the agent's own
// bookkeeping tool for recording which donor it picked after calling
// rank_donors, so the orchestrator knows who `send_email`/`dispatch_courier`
// are talking to.

export const selectDonorTool = defineTool({
  name: "select_donor",
  description:
    "Record the chosen donor site for this Transfer, after calling rank_donors. Call this before send_email so the orchestrator knows who the email is going to.",
  argsSchema: z.object({
    transferId: z.number().int(),
    donorSiteId: z.string(),
  }),
  execute: async ({ transferId, donorSiteId }) => {
    await setTransferDonor(transferId, donorSiteId);
    return { donorSiteId };
  },
});
