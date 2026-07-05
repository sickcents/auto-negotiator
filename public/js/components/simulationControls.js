import { api } from "../api.js";

// Cached from the last populateSimSiteOptions call so renderSiteLevels (#36)
// can read a Site's stock inline off the same GET /sites data Network
// Status renders from, instead of a separate/stale fetch.
let cachedSites = [];

export function populateSimSiteOptions(sites) {
  cachedSites = sites;
  const select = document.getElementById("sim-site");
  // Preserve the operator's picked Site across reloads (#36 follow-up):
  // this rebuilds every ~4s on the periodic refresh, and without restoring
  // the prior value the browser silently resets the <select> to its first
  // option — invisible before, but a live-updating stock readout tied to
  // the "selected" Site now makes that reset an obvious bug.
  const previousValue = select.value;
  select.innerHTML = sites.map((s) => `<option value="${s.id}">${s.name} (${s.siteType})</option>`).join("");
  if (sites.some((s) => s.id === previousValue)) select.value = previousValue;
  renderSiteLevels();
}

// Current stock / Operating Threshold / min_buffer for whichever Site +
// Hardware Type are selected (#36) — re-run on either selector's change and
// after every sites reload, so it can't drift from what's actually loaded.
function renderSiteLevels() {
  const el = document.getElementById("sim-site-levels");
  const site = cachedSites.find((s) => s.id === document.getElementById("sim-site").value);
  if (!site) {
    el.textContent = "";
    return;
  }
  const hardwareType = document.getElementById("sim-hardware").value;
  const [current, threshold, buffer] =
    hardwareType === "printer"
      ? [site.currentPrinters, site.operatingThresholdPrinters, site.printerMinBuffer]
      : [site.currentScanners, site.operatingThresholdScanners, site.scannerMinBuffer];
  el.textContent = `${current} current · Op. Threshold ${threshold} · Min Buffer ${buffer}`;
}

// onTriggered({ transfer }) fires after the POST resolves, so the caller
// can refresh sites/transfers/map without this component knowing about them.
export function initSimulationControls({ onTriggered }) {
  document.getElementById("sim-site").addEventListener("change", renderSiteLevels);
  document.getElementById("sim-hardware").addEventListener("change", renderSiteLevels);

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
