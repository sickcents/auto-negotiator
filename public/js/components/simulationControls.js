import { api } from "../api.js";

export function populateSimSiteOptions(sites) {
  const select = document.getElementById("sim-site");
  select.innerHTML = sites.map((s) => `<option value="${s.id}">${s.name} (${s.siteType})</option>`).join("");
}

// onTriggered({ transfer }) fires after the POST resolves, so the caller
// can refresh sites/transfers/map without this component knowing about them.
export function initSimulationControls({ onTriggered }) {
  document.getElementById("sim-btn").addEventListener("click", async () => {
    const siteId = document.getElementById("sim-site").value;
    const hardwareType = document.getElementById("sim-hardware").value;
    const dropTo = Number(document.getElementById("sim-drop-to").value) || 0;

    const result = await api("/simulate-incident", {
      method: "POST",
      body: JSON.stringify({ siteId, hardwareType, dropTo }),
    });

    document.getElementById("sim-result").textContent = result.transfer
      ? `Triggered Transfer #${result.transfer.id} (${result.transfer.quantity}x ${hardwareType}).`
      : "No trigger — thresholds not crossed (or a Transfer is already in flight for this site/hardware).";

    await onTriggered(result);
  });
}
