import { z } from "zod";
import type { ToolDefinition } from "./types.js";
import { queryInventoryTool, rankDonorsTool } from "./inventoryApi.js";
import { sendEmailTool, readMessagesTool } from "./emailApi.js";
import { checkPromotionScheduleTool } from "./calendarApi.js";
import { dispatchCourierTool } from "./logisticsApi.js";
import { pushZplConfigTool } from "./zplApi.js";
import { openTicketTool, closeTicketTool } from "./itsmApi.js";
import { selectDonorTool } from "./transferApi.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOLS: ToolDefinition<any>[] = [
  queryInventoryTool,
  rankDonorsTool,
  selectDonorTool,
  sendEmailTool,
  readMessagesTool,
  checkPromotionScheduleTool,
  dispatchCourierTool,
  pushZplConfigTool,
  openTicketTool,
  closeTicketTool,
];

const TOOLS_BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]));

export function getTool(name: string) {
  return TOOLS_BY_NAME.get(name);
}

// Plain-text tool descriptions for the system prompt — we deliberately
// don't rely on any provider's native function-calling schema (ADR-0005),
// since the whole point is the console's behavior staying identical
// whichever LLM Engine is configured.
export function describeToolsForPrompt(): string {
  return TOOLS.map((tool) => {
    const shape = (tool.argsSchema as z.ZodObject<z.ZodRawShape>).shape;
    const argNames = Object.keys(shape).join(", ");
    return `- ${tool.name}(${argNames}): ${tool.description}`;
  }).join("\n");
}
