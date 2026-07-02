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

  renderAgentConsole(detail.agentSteps, detail.messages, {
    currentStatus: detail.transfer.status,
    transferId: detail.transfer.id,
  });
}
