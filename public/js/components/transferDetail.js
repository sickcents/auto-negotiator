import { statusMeta } from "../format.js";
import { renderAgentConsole } from "./agentConsole.js";

// The timeline strip is always visible (#3/#5) -- this just gives instant
// feedback on click, before the async GET /transfers/:id resolves.
export function markTransferSelected(id) {
  document.getElementById("detail-id").textContent = `#${id}`;
}

export function renderTransferDetail(detail) {
  const meta = statusMeta(detail.transfer.status);
  const statusEl = document.getElementById("detail-status");
  statusEl.textContent = meta.label;
  statusEl.className = `status-pill status-pill--${meta.tone}`;

  // Manager Reply Injection and Regional Director Override are
  // circumstance-only (#17): each is only actionable in the one status that
  // put the agent in that spot (awaiting_reply / deadlock — see
  // lib/domain/agentStep.ts, lib/domain/regionalOverride.ts), so they're
  // hidden fixtures rather than always-on controls.
  document.getElementById("manager-reply-block").hidden = detail.transfer.status !== "awaiting_reply";
  document.getElementById("regional-override-block").hidden = detail.transfer.status !== "deadlock";

  renderAgentConsole(detail.agentSteps, detail.messages, {
    currentStatus: detail.transfer.status,
    transferId: detail.transfer.id,
  });
}
