import { statusMeta } from "../format.js";

export function renderTransferList(transfers, { selectedTransferId, onSelect }) {
  const container = document.getElementById("transfer-list");
  if (transfers.length === 0) {
    container.innerHTML = `<p class="hint">No transfers yet — use Simulate Incident above.</p>`;
    return;
  }

  container.innerHTML = transfers
    .map((t) => {
      const meta = statusMeta(t.status);
      const selected = t.id === selectedTransferId ? "is-selected" : "";
      return `<div class="transfer-row ${selected}" data-id="${t.id}">
        <span>#${t.id} · ${t.receiverSiteId} needs ${t.quantity}x ${t.hardwareType}${t.donorSiteId ? ` from ${t.donorSiteId}` : ""}</span>
        <span class="status-pill status-pill--${meta.tone}">${meta.label}</span>
      </div>`;
    })
    .join("");

  container.querySelectorAll(".transfer-row").forEach((row) => {
    row.addEventListener("click", () => onSelect(Number(row.dataset.id)));
  });
}
