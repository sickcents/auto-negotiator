import { statusMeta, transferSummary } from "../format.js";
import { renderAgentConsole } from "./agentConsole.js";
import { icon } from "../icons.js";
import { repositionRailGrabTabs } from "./railGrabTabs.js";

// initDetailHeader wires the panel's own close button (#35) — the panel is
// a dismissable overlay now, not an always-present region, so closing it is
// this component's own concern rather than something the caller (main.js)
// reaches in and does by hand.
export function initDetailHeader(onClose) {
  document.getElementById("detail-close-btn").insertAdjacentHTML("afterbegin", icon("x"));
  document.getElementById("detail-close-btn").addEventListener("click", onClose);
}

// Un-hides the panel (#35) — it starts hidden and only appears once a
// transfer is selected, closing again via the X button (initDetailHeader)
// or a fresh selection replacing it. Instant feedback on click, before the
// async GET /transfers/:id resolves. The summary line reuses the exact same
// wording as the clicked row (#29) so the detail header reads as that row's
// own content, just expanded.
export function markTransferSelected(id, transfer) {
  document.getElementById("transfer-detail").hidden = false;
  document.getElementById("detail-id").textContent = `#${id}`;
  document.getElementById("detail-summary").textContent = `Request: ${transferSummary(transfer)}`;
  repositionRailGrabTabs();
}

// Hides the panel (#35) — the counterpart to markTransferSelected's unhide.
export function hideTransferDetail() {
  document.getElementById("transfer-detail").hidden = true;
  repositionRailGrabTabs();
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
    transferCreatedAt: detail.transfer.createdAt,
  });
}
