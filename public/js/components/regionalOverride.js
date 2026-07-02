import { api } from "../api.js";

export function populateOverrideDonorOptions(sites) {
  const select = document.getElementById("override-donor");
  select.innerHTML = sites.map((s) => `<option value="${s.id}">${s.name} (${s.siteType})</option>`).join("");
}

export function initRegionalOverride({ getSelectedTransferId, onResolved }) {
  async function sendOverride(payload) {
    const id = getSelectedTransferId();
    if (id == null) return;
    const result = await api(`/transfers/${id}/override`, { method: "POST", body: JSON.stringify(payload) });
    const el = document.getElementById("override-result");
    el.textContent =
      result.topRankedAlternativeKm != null
        ? `Resolved. Route: ${result.distanceKm}km vs. top-ranked alternative ${result.topRankedAlternativeKm}km.`
        : `Resolved. Route: ${result.distanceKm}km.`;
    await onResolved();
  }

  document.getElementById("override-approve").addEventListener("click", () => sendOverride({ action: "approve" }));
  document.getElementById("override-reroute").addEventListener("click", () => {
    const donorSiteId = document.getElementById("override-donor").value;
    sendOverride({ action: "reroute", donorSiteId });
  });
}
