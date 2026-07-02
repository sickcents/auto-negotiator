import { statusMeta } from "../format.js";
import { renderAgentConsole } from "./agentConsole.js";

export function showTransferDetailPanel(id) {
  document.getElementById("transfer-detail").hidden = false;
  document.getElementById("detail-id").textContent = `#${id}`;
}

export function renderTransferDetail(detail) {
  const meta = statusMeta(detail.transfer.status);
  const statusEl = document.getElementById("detail-status");
  statusEl.textContent = meta.label;
  statusEl.className = `status-pill status-pill--${meta.tone}`;

  renderAgentConsole(detail.agentSteps, detail.messages);
}
