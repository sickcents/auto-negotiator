import type { z } from "zod";

// All tools are mocked/in-process (ADR-0001) — no real third-party account
// or OAuth for any of them. Each tool describes itself in plain text for
// the system prompt (design-session Q16: no reliance on a specific
// provider's native function-calling feature).
export interface ToolDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  argsSchema: T;
  execute: (args: z.infer<T>) => Promise<unknown>;
}

export function defineTool<T extends z.ZodTypeAny>(tool: ToolDefinition<T>): ToolDefinition<T> {
  return tool;
}
