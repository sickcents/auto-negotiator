import { statusMeta, transferSummary } from "../format.js";
import { renderAgentConsole } from "./agentConsole.js";
import { icon } from "../icons.js";

// Caret replaces the standard .eyebrow dot (#29) — points down from the
// transfer row above, reading as "this is that row, expanded" rather than a
// generic section label. Injected once; the row's own text never changes.
export function initDetailHeader() {
  document.getElementById("detail-eyebrow").insertAdjacentHTML("afterbegin", icon("caret-down"));
  document.getElementById("detail-close-btn").insertAdjacentHTML("afterbegin", icon("x"));
}

// Transfer Detail is now its own dismissable floating panel (#35), hidden
// until a transfer is selected. onClose lets main.js clear selection state
// (stop polling, drop the row/map highlight) in step with the panel hiding.
export function initDetailClose(onClose) {
  document.getElementById("detail-close-btn").addEventListener("click", () => {
    document.getElementById("transfer-detail").hidden = true;
    onClose();
  });
}

// The timeline strip is always visible (#3/#5) -- this just gives instant
// feedback on click, before the async GET /transfers/:id resolves. The
// summary line reuses the exact same wording as the clicked row (#29) so
// the detail header reads as that row's own content, just expanded.
export function markTransferSelected(id, transfer) {
  document.getElementById("transfer-detail").hidden = false;
  document.getElementById("detail-id").textContent = `#${id}`;
  document.getElementById("detail-summary").textContent = transferSummary(transfer);
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
