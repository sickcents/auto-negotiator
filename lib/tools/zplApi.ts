import { z } from "zod";
import { defineTool } from "./types.js";

// PRD Section 5 "ZPL Provisioning API" — logs the generated ZPL payload, no
// real hardware/thin-client is contacted (ADR-0001).

export const pushZplConfigTool = defineTool({
  name: "push_zpl_config",
  description:
    "Simulate reconfiguring a printer for its destination site by generating and logging a ZPL payload. No real device is contacted.",
  argsSchema: z.object({
    toSiteId: z.string(),
    hardwareType: z.enum(["scanner", "printer"]),
  }),
  execute: async ({ toSiteId, hardwareType }) => {
    if (hardwareType !== "printer") {
      return { skipped: true, reason: "ZPL provisioning only applies to printers (ZQ521)" };
    }
    const zplPayload = `^XA\n^FO50,50^A0N,40,40^FD${toSiteId.toUpperCase()}^FS\n^XZ`;
    return { delivered: true, zplPayload };
  },
});
