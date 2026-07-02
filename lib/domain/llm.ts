import OpenAI from "openai";
import { z } from "zod";
import type { ToolDefinition } from "../tools/types.js";

// Gemini's OpenAI-compatible endpoint (ADR-0006) — the `openai` package is
// just a generic client for the "chat completions" request/response shape;
// pointing its baseURL here sends requests to Google, authenticated with
// GEMINI_API_KEY, never to api.openai.com.
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

// Enforced thought/tool-call envelope (ADR-0005): every turn returns this
// shape regardless of which LLM Engine is configured, so the Agent
// Console's reasoning trace doesn't depend on a specific provider's native
// reasoning exposure. Strictly one tool call per turn (design-session Q17)
// — `action` is a single tool_call or a final status, never an array.
const AgentTurnEnvelopeSchema = z.object({
  thought: z.string().min(1),
  action: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("tool_call"),
      tool: z.string(),
      args: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal("final"),
      status: z.enum(["awaiting_reply", "completed"]),
    }),
  ]),
});

export interface AgentTurn {
  thought: string;
  action:
    | { type: "tool_call"; tool: string; args: Record<string, unknown> }
    | { type: "final"; status: "awaiting_reply" | "completed" };
}

// Validates the envelope shape AND (for tool_call actions) that the tool
// name is registered and its args match that tool's own schema — a
// hallucinated tool name or malformed args fails here, same as bad JSON
// (design-session Q19).
function validateTurn(raw: unknown, tools: readonly ToolDefinition[]): { ok: true; turn: AgentTurn } | { ok: false; error: string } {
  const envelope = AgentTurnEnvelopeSchema.safeParse(raw);
  if (!envelope.success) return { ok: false, error: envelope.error.message };

  if (envelope.data.action.type === "final") {
    return { ok: true, turn: envelope.data as AgentTurn };
  }

  const toolName = (envelope.data.action as { tool: string }).tool;
  const matchedTool = tools.find((t) => t.name === toolName);
  if (!matchedTool) {
    return { ok: false, error: `Unknown tool "${toolName}". Available tools: ${tools.map((t) => t.name).join(", ")}` };
  }

  const argsResult = matchedTool.argsSchema.safeParse((envelope.data.action as { args: unknown }).args);
  if (!argsResult.success) {
    return { ok: false, error: `Invalid args for tool "${toolName}": ${argsResult.error.message}` };
  }

  return {
    ok: true,
    turn: {
      thought: envelope.data.thought,
      action: { type: "tool_call", tool: toolName, args: argsResult.data as Record<string, unknown> },
    },
  };
}

export class SchemaValidationError extends Error {
  constructor(public readonly raw: string, public readonly validationError: string) {
    super(`Agent turn failed schema validation twice: ${validationError}`);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: requireEnv("GEMINI_API_KEY"), baseURL: GEMINI_BASE_URL });
  return client;
}

async function requestOnce(systemPrompt: string, userPrompt: string): Promise<string> {
  const completion = await getClient().chat.completions.create({
    model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

// One retry with the validation error fed back to the model, then give up
// (design-session Q19) — a live demo can never hang on an infinite retry
// loop; it fails visibly and fast instead.
export async function requestAgentTurn(
  systemPrompt: string,
  userPrompt: string,
  tools: readonly ToolDefinition[]
): Promise<AgentTurn> {
  const firstRaw = await requestOnce(systemPrompt, userPrompt);
  const firstResult = validateTurn(safeJsonParse(firstRaw), tools);
  if (firstResult.ok) return firstResult.turn;

  const retryPrompt = `${userPrompt}\n\nYour previous response was invalid: ${firstResult.error}\nPrevious response: ${firstRaw}\nRespond again with ONLY valid JSON matching the required schema.`;
  const secondRaw = await requestOnce(systemPrompt, retryPrompt);
  const secondResult = validateTurn(safeJsonParse(secondRaw), tools);
  if (secondResult.ok) return secondResult.turn;

  throw new SchemaValidationError(secondRaw, secondResult.error);
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
