// AgentTimeline — renders the agent-step / message history for the
// selected Transfer as a vertical timeline, grouped into sections by the
// negotiation state (STATUS_META, public/js/format.js) each event
// happened in, and keeps a plain-text mirror for the Copy button.

import { STATUS_META, statusMeta } from "../format.js";

const STATUS_ORDER = Object.keys(STATUS_META);

let consoleText = "";
let openGroups = new Set(STATUS_ORDER);
let lastTransferId = null;
let toggleListenerAttached = false;

export function renderAgentConsole(agentSteps, messages, { currentStatus, transferId } = {}) {
  if (transferId !== lastTransferId) {
    lastTransferId = transferId;
    openGroups = new Set(STATUS_ORDER); // fresh transfer selection -> fresh defaults
  }

  const events = mergeEvents(agentSteps, messages);
  const groups = groupByStatus(events, currentStatus);

  const consoleEl = document.getElementById("agent-timeline");
  ensureToggleListener(consoleEl);

  const scrollTop = consoleEl.scrollTop; // preserve position across poll re-renders
  const sections = STATUS_ORDER.filter((status) => groups.has(status)).map((status) => groupHtml(status, groups.get(status)));
  consoleEl.innerHTML = sections.join("") || `<p class="hint">No agent activity yet.</p>`;
  consoleEl.scrollTop = scrollTop;

  consoleText = events.map(eventText).join("\n\n");
}

export function initConsoleCopy() {
  document.getElementById("console-copy-btn").addEventListener("click", async () => {
    const btn = document.getElementById("console-copy-btn");
    try {
      await navigator.clipboard.writeText(consoleText);
      btn.textContent = "Copied!";
    } catch {
      btn.textContent = "Copy failed";
    }
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });
}

// <details>'s "toggle" event doesn't bubble, but it IS visible to a
// capture-phase listener on an ancestor — attached once (the element
// itself survives across renders even though its innerHTML doesn't), so
// user-expanded/collapsed groups aren't reset by a full re-render.
function ensureToggleListener(consoleEl) {
  if (toggleListenerAttached) return;
  toggleListenerAttached = true;
  consoleEl.addEventListener(
    "toggle",
    (event) => {
      const status = event.target.dataset?.status;
      if (!status) return;
      if (event.target.open) openGroups.add(status);
      else openGroups.delete(status);
    },
    true
  );
}

function mergeEvents(agentSteps, messages) {
  return [
    ...agentSteps.map((s) => ({ kind: "step", at: s.created_at, ...s })),
    ...messages.map((m) => ({ kind: "message", at: m.createdAt ?? m.created_at, ...m })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));
}

// agent_steps/messages don't carry a status column (Q: "not a new API") --
// this replays the same deterministic tool_name -> status transitions the
// backend applies (lib/domain/agentStep.ts's decideNextStatus and
// lib/domain/regionalOverride.ts's resolveOverride) purely to decide which
// section an event belongs to -- with one deliberate deviation: unmatched
// (info-gathering) tool calls stay in the current group instead of
// decideNextStatus's literal "sourcing" default, which reads better for a
// display grouping than resetting phase on every query_inventory call.
function groupByStatus(events, actualCurrentStatus) {
  const groups = new Map();
  let currentStatus = "sourcing";
  for (const e of events) {
    if (!groups.has(currentStatus)) groups.set(currentStatus, []);
    groups.get(currentStatus).push(e);
    if (e.kind === "step") currentStatus = nextStatusAfterStep(currentStatus, e);
  }

  // The deadlock pushback counter isn't derivable from steps/messages
  // alone, so the replay above can drift from the transfer's real status.
  // If it does, trust the API's status for the most recently active group.
  if (actualCurrentStatus && groups.size && currentStatus !== actualCurrentStatus) {
    const drifted = groups.get(currentStatus) ?? [];
    groups.delete(currentStatus);
    groups.set(actualCurrentStatus, [...(groups.get(actualCurrentStatus) ?? []), ...drifted]);
  }

  return groups;
}

function nextStatusAfterStep(currentStatus, step) {
  if (step.tool_name === "regional_director_override") return "completed";
  if (step.tool_name === "none") {
    const result = step.tool_result;
    if (result && typeof result === "object") {
      if ("final" in result) return result.final;
      if ("error" in result) return "errored";
    }
    return currentStatus;
  }
  if (step.tool_name === "send_email") {
    const args = typeof step.tool_args === "string" ? JSON.parse(step.tool_args) : step.tool_args;
    const stage = args?.stage ?? "initial";
    if (stage === "firmness_lock") return "locked";
    if (stage === "escalation") return currentStatus;
    return "awaiting_reply";
  }
  if (step.tool_name === "dispatch_courier") return "in_transit";
  if (step.tool_name === "close_ticket") return "completed";
  // Info-gathering calls (rank_donors, query_inventory, open_ticket, ...)
  // don't move the needle — group them with whichever phase they're
  // actually happening in rather than resetting to "sourcing".
  return currentStatus;
}

function groupHtml(status, events) {
  const meta = statusMeta(status);
  const open = openGroups.has(status) ? "open" : "";
  return `<details class="timeline-group" data-status="${status}" ${open}>
    <summary class="timeline-group__label status-pill status-pill--${meta.tone}">${meta.label}</summary>
    <div class="timeline-group__events">${events.map(eventHtml).join("")}</div>
  </details>`;
}

function eventHtml(e) {
  if (e.kind === "step") {
    const args = typeof e.tool_args === "string" ? e.tool_args : JSON.stringify(e.tool_args);
    return `<div class="line"><span class="thought">thought:</span> ${e.thought}<br/><span class="tool">-> ${e.tool_name}(${args})</span></div>`;
  }
  return `<div class="line message-${e.sender}">[${e.sender}] ${e.body}</div>`;
}

function eventText(e) {
  if (e.kind === "step") {
    const args = typeof e.tool_args === "string" ? e.tool_args : JSON.stringify(e.tool_args);
    return `thought: ${e.thought}\n-> ${e.tool_name}(${args})`;
  }
  return `[${e.sender}] ${e.body}`;
}
