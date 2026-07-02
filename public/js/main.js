// AppShell — owns state and orchestrates the components in
// public/js/components/*; each component only knows the DOM nodes it owns.

import { api } from "./api.js";
import { renderNetworkStatus, initSiteFilter } from "./components/networkStatus.js";
import { renderMap, initMapTooltip } from "./components/mapView.js";
import { populateSimSiteOptions, initSimulationControls } from "./components/simulationControls.js";
import { renderTransferList } from "./components/transferList.js";
import { showTransferDetailPanel, renderTransferDetail } from "./components/transferDetail.js";
import { initConsoleCopy } from "./components/agentConsole.js";
import { initManagerReply } from "./components/managerReply.js";
import { populateOverrideDonorOptions, initRegionalOverride } from "./components/regionalOverride.js";
import { renderNavStatus } from "./components/nav.js";

const state = {
  sites: [],
  transfers: [],
  selectedTransferId: null,
  pollTimer: null,
  siteTypeFilter: new Set(["XL", "L", "M", "S"]),
};

async function loadSites() {
  const { sites } = await api("/sites");
  state.sites = sites;
  renderNetworkStatus(state.sites, state.siteTypeFilter);
  renderMap(state.sites, state.transfers, state.selectedTransferId, state.siteTypeFilter);
  populateSimSiteOptions(state.sites);
  populateOverrideDonorOptions(state.sites);
  renderNavStatus(state.sites, state.transfers);
}

async function loadTransfers() {
  const { transfers } = await api("/transfers");
  state.transfers = transfers;
  renderTransferList(state.transfers, { selectedTransferId: state.selectedTransferId, onSelect: selectTransfer });
  renderMap(state.sites, state.transfers, state.selectedTransferId, state.siteTypeFilter);
  renderNavStatus(state.sites, state.transfers);
}

function selectTransfer(id) {
  state.selectedTransferId = id;
  showTransferDetailPanel(id);
  renderTransferList(state.transfers, { selectedTransferId: id, onSelect: selectTransfer });
  renderMap(state.sites, state.transfers, id, state.siteTypeFilter);

  if (state.pollTimer) clearInterval(state.pollTimer);
  pollTransfer();
  state.pollTimer = setInterval(pollTransfer, 1500);
}

// Each poll tick both drives the next agent turn *and* refreshes the
// console/log — one mechanism serves both jobs (PRD Section 7/8). The step
// endpoint is cheap to call when there's nothing to do (`skipped: true`).
async function pollTransfer() {
  const id = state.selectedTransferId;
  if (id == null) return;
  try {
    await api(`/transfers/${id}/step`, { method: "POST" });
  } catch (err) {
    console.error("step failed", err);
  }
  const detail = await api(`/transfers/${id}`);
  renderTransferDetail(detail);
  await loadSites(); // stock may have changed (dispatch_courier)
  await loadTransfers();
}

initMapTooltip();
initConsoleCopy();
initSiteFilter({
  onChange: (activeTypes) => {
    state.siteTypeFilter = activeTypes;
    renderNetworkStatus(state.sites, state.siteTypeFilter);
    renderMap(state.sites, state.transfers, state.selectedTransferId, state.siteTypeFilter);
  },
});
initSimulationControls({
  onTriggered: async () => {
    await loadSites();
    await loadTransfers();
  },
});
initManagerReply({ getSelectedTransferId: () => state.selectedTransferId, onSent: pollTransfer });
initRegionalOverride({ getSelectedTransferId: () => state.selectedTransferId, onResolved: pollTransfer });

loadSites();
loadTransfers();
setInterval(loadTransfers, 4000);
