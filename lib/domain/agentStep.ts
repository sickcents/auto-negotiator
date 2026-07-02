import { requestAgentTurn, SchemaValidationError, type AgentTurn } from "./llm.js";
import { TOOLS, getTool, describeToolsForPrompt } from "../tools/registry.js";
import { getSite } from "./siteRepo.js";
import {
  getTransfer,
  getMessages,
  getAgentSteps,
  setTransferStatus,
  declineDonor,
  logAgentStep,
  markEscalationSent,
  countManagerRepliesSinceFirstFirmness,
  recordFirmnessPushback,
  type TransferRow,
} from "./transferRepo.js";

export interface StepResult {
  status: TransferRow["status"];
  thought?: string;
  toolName?: string;
  toolResult?: unknown;
  skipped?: boolean;
  error?: string;
}

// States where the agent has nothing to do until a human (manager reply or
// Regional Director override) provides new input — the frontend's polling
// loop (Q18) naturally stops making progress here without repeatedly
// spending an LLM call on a no-op. `deadlock` is special: the agent still
// gets exactly one turn to send the escalation summary before it counts
// as "waiting." `in_transit` is NOT one of these — per PRD Section 8 steps
// 5-6, the agent still has autonomous work left after dispatch_courier
// (push_zpl_config, close_ticket, final "completed"), no human input
// required.
function isWaitingOnHuman(transfer: TransferRow): boolean {
  if (["awaiting_reply", "locked", "errored", "completed"].includes(transfer.status)) {
    return true;
  }
  if (transfer.status === "deadlock") return transfer.escalationSent;
  return false;
}

function buildSystemPrompt(): string {
  return `You are the Auto Negotiator agent for the ClickShop convenience store network in Eastern Singapore.
Your job: resolve a hardware shortage by sourcing a donor site, negotiating the transfer, and closing it out.

Respond with ONLY a JSON object matching this shape, nothing else:
{"thought": "<one sentence: why you're doing this>", "action": <action>}

<action> is one of:
- {"type": "tool_call", "tool": "<tool name>", "args": {...}}
- {"type": "final", "status": "awaiting_reply" | "completed"}   (only when there is truly nothing left to do this turn)

Exactly one tool call per turn. Never invent a tool name or a site ID that wasn't given to you.

Available tools:
${describeToolsForPrompt()}

"priorSteps" in the prompt is YOUR OWN tool-call history for this Transfer,
oldest first — each turn is a fresh call with no memory beyond what's in this
prompt, so always check priorSteps before repeating a tool call: if you
already called rank_donors and got candidates back, don't call it again —
call select_donor next.

Workflow:
1. Assess the shortage, then call rank_donors to find a donor, then select_donor, then send_email (stage="initial") to request the transfer.
2. When a manager reply appears in the message history, decide:
   - Concession Protocol: if they cite a specific event (e.g. a promo), call check_promotion_schedule to verify. If verified, call rank_donors again (the declined donor is already excluded) and select_donor + send_email (stage="initial") for the new donor.
   - Firmness Protocol: if they refuse without a verifiable event, call query_inventory for the donor's operating_threshold and current stock, then send_email (stage="firmness_lock") citing the exact numbers.
   - If this Transfer already has a status of "deadlock", call send_email (stage="escalation") addressed to the Regional Director with a synthesized summary of the deadlock, then respond with action "final" status "awaiting_reply".
3. Once the manager agrees, call open_ticket (if not already open), then dispatch_courier, then push_zpl_config (for printers), then close_ticket, then respond with action "final" status "completed".`;
}

function buildUserPrompt(context: {
  transfer: TransferRow;
  receiverSite: Awaited<ReturnType<typeof getSite>>;
  donorSite: Awaited<ReturnType<typeof getSite>> | null;
  messages: Awaited<ReturnType<typeof getMessages>>;
  priorSteps: Awaited<ReturnType<typeof getAgentSteps>>;
}): string {
  const { transfer, receiverSite, donorSite, messages, priorSteps } = context;
  return JSON.stringify(
    {
      transfer: {
        id: transfer.id,
        hardwareType: transfer.hardwareType,
        quantity: transfer.quantity,
        status: transfer.status,
        declinedSiteIds: transfer.declinedSiteIds,
        pushbackCount: transfer.pushbackCount,
      },
      receiverSite,
      donorSite,
      messageHistory: messages,
      priorSteps,
    },
    null,
    2
  );
}

// Deterministic post-tool-call status transitions (kept in code, not left
// to the LLM's self-report) — mirrors PRD Section 8's phases.
function decideNextStatus(
  currentStatus: TransferRow["status"],
  turn: AgentTurn
): TransferRow["status"] {
  if (turn.action.type === "final") return turn.action.status;

  const { tool, args } = turn.action;
  if (tool === "send_email") {
    const stage = (args as { stage?: string }).stage ?? "initial";
    if (stage === "firmness_lock") return "locked";
    if (stage === "escalation") return currentStatus; // stays in deadlock until Regional Director acts
    return "awaiting_reply";
  }
  if (tool === "dispatch_courier") return "in_transit";
  if (tool === "close_ticket") return "completed";
  return "sourcing"; // information-gathering tool calls stay mid-phase
}

// Fulfillment actions — the ones that only happen once the manager has
// actually agreed. Anything else, once the Firmness Protocol is already in
// play, means the negotiation is still stuck (see countManagerRepliesSinceFirstFirmness
// below) — including a "final" no-op turn where the agent just notes it's
// already escalated and waiting, which isn't a tool call at all.
function isProgressToFulfillment(turn: AgentTurn): boolean {
  if (turn.action.type === "final") return turn.action.status === "completed";
  return ["open_ticket", "dispatch_courier", "close_ticket"].includes(turn.action.tool);
}

// Runs exactly one thought -> tool_call turn (design-session Q17/Q18). The
// frontend calls this repeatedly; it's meant to be cheap to call when
// there's nothing to do (see WAITING_ON_HUMAN).
export async function runAgentStep(transferId: number): Promise<StepResult> {
  const transfer = await getTransfer(transferId);
  if (!transfer) throw new Error(`No such Transfer: ${transferId}`);

  if (isWaitingOnHuman(transfer)) {
    return { status: transfer.status, skipped: true };
  }

  const [receiverSite, donorSite, messages, priorSteps] = await Promise.all([
    getSite(transfer.receiverSiteId),
    transfer.donorSiteId ? getSite(transfer.donorSiteId) : Promise.resolve(null),
    getMessages(transferId),
    getAgentSteps(transferId),
  ]);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({ transfer, receiverSite, donorSite, messages, priorSteps });

  let turn: AgentTurn;
  try {
    turn = await requestAgentTurn(systemPrompt, userPrompt, TOOLS);
  } catch (err) {
    if (err instanceof SchemaValidationError) {
      await setTransferStatus(transferId, "errored");
      await logAgentStep({
        transferId,
        thought: "Agent output failed validation twice.",
        toolName: "none",
        toolArgs: {},
        toolResult: { error: err.validationError },
      });
      return { status: "errored", error: err.validationError };
    }
    throw err;
  }

  // Escalation Protocol (Q10): once the Firmness Protocol has been invoked
  // at least once on this Transfer (across any donor — Deadlock is scoped
  // to the whole Transfer per CONTEXT.md, not one donor attempt), every
  // manager reply that arrives afterward is implicitly a rejection unless
  // the agent's very next move actually progresses to fulfillment.
  // Comparing how many such replies have arrived against pushback_count
  // tells us whether *this* turn owes an increment — mechanical and
  // agnostic to whether the turn is a tool_call or a "final" no-op, and to
  // whichever stage label the agent's own reasoning picks. This is what
  // makes the deadlock cap "fixed," not a judgment call made fresh each
  // time (CONTEXT.md).
  let pushbackDeadlocked = false;
  const repliesSinceFirmness = await countManagerRepliesSinceFirstFirmness(transferId);
  if (repliesSinceFirmness > transfer.pushbackCount && !isProgressToFulfillment(turn)) {
    ({ deadlocked: pushbackDeadlocked } = await recordFirmnessPushback(transferId));
  }

  if (turn.action.type === "final") {
    const finalStatus = pushbackDeadlocked ? "deadlock" : turn.action.status;
    await setTransferStatus(transferId, finalStatus);
    await logAgentStep({ transferId, thought: turn.thought, toolName: "none", toolArgs: {}, toolResult: { final: turn.action.status } });
    return { status: finalStatus, thought: turn.thought };
  }

  const tool = getTool(turn.action.tool);
  if (!tool) {
    // Should not happen — llm.ts already validates the tool name — but
    // keep this as a defensive fallback rather than throwing.
    await setTransferStatus(transferId, "errored");
    return { status: "errored", error: `Unknown tool: ${turn.action.tool}` };
  }

  const toolResult = await tool.execute(turn.action.args);

  if (turn.action.tool === "send_email" && (turn.action.args as { stage?: string }).stage === "escalation") {
    await markEscalationSent(transferId);
  }

  // Concession Protocol re-routing (Q7/Q8): the agent excludes a declined
  // donor and re-ranks, rather than the Transfer being replaced.
  if (
    turn.action.tool === "select_donor" &&
    transfer.donorSiteId &&
    transfer.donorSiteId !== (turn.action.args as { donorSiteId: string }).donorSiteId
  ) {
    await declineDonor(transferId, transfer.donorSiteId);
  }

  await logAgentStep({
    transferId,
    thought: turn.thought,
    toolName: turn.action.tool,
    toolArgs: turn.action.args,
    toolResult,
  });

  const nextStatus = pushbackDeadlocked ? "deadlock" : decideNextStatus(transfer.status, turn);
  await setTransferStatus(transferId, nextStatus);

  return { status: nextStatus, thought: turn.thought, toolName: turn.action.tool, toolResult };
}
