// AppShell — owns state and orchestrates the components in
// public/js/components/*; each component only knows the DOM nodes it owns.

import { api } from "./api.js";
import { renderNetworkStatus, initSiteFilter } from "./components/networkStatus.js";
import { renderMap, initMapTooltip } from "./components/mapView.js";
import { populateSimSiteOptions, initSimulationControls } from "./components/simulationControls.js";
import { renderTransferList } from "./components/transferList.js";
import { markTransferSelected, renderTransferDetail } from "./components/transferDetail.js";
import { initConsoleCopy } from "./components/agentConsole.js";
import { initManagerReply } from "./components/managerReply.js";
import { populateOverrideDonorOptions, initRegionalOverride } from "./components/regionalOverride.js";
import { renderNavStatus } from "./components/nav.js";

const state = {
  sites: [],
  transfers: [],
  selectedTransferId: null,
  pollTimer: null,
  pollGeneration: 0,
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
  if (id === state.selectedTransferId) return; // already viewing it, poll loop already running

  state.selectedTransferId = id;
  markTransferSelected(id);
  renderTransferList(state.transfers, { selectedTransferId: id, onSelect: selectTransfer });
  renderMap(state.sites, state.transfers, id, state.siteTypeFilter);

  refreshDetail(id); // console/timeline render immediately, whether or not a turn will run

  // A Transfer that's waiting on a human is just being *viewed* — firing
  // /step for it would be a guaranteed no-op round-trip (#9). The poll loop
  // only starts when the agent actually has autonomous turns left to run.
  const transfer = state.transfers.find((t) => t.id === id);
  if (transfer && WAITING_ON_HUMAN_STATUSES.has(transfer.status)) {
    stopPolling();
  } else {
    startPolling();
  }
}

async function refreshDetail(id) {
  const detail = await api(`/transfers/${id}`);
  if (id !== state.selectedTransferId) return; // selection moved on mid-fetch
  renderTransferDetail(detail);
}

// (Re)starts the short-poll loop (PRD Section 7/8). Called on transfer
// selection and whenever new human input arrives (manager reply, Regional
// Director override) that could give the agent something to do again.
//
// Uses a self-rescheduling setTimeout (not setInterval): /step calls an LLM
// and can easily run past 1.5s, so a fixed-rate interval would fire the
// next tick before the previous one's fetch chain finished, stacking up
// overlapping polls indefinitely. The generation counter guards against a
// stale in-flight cycle (from before a new selection/reply) rescheduling
// itself after a newer one has already taken over.
function startPolling() {
  stopPolling();
  runPollLoop(state.pollGeneration);
}

// Invalidates any in-flight poll cycle (via the generation bump) and cancels
// the pending reschedule, without starting a new loop.
function stopPolling() {
  state.pollGeneration += 1;
  if (state.pollTimer) clearTimeout(state.pollTimer);
  state.pollTimer = null;
}

// ~1.5s between turns while the agent is actively working (PRD Section 7/8
// calls for a 1-2s cadence so a live demo shows steps landing one after
// another); the loop stops entirely once a human's input is needed.
const POLL_INTERVAL_MS = 1500;

async function runPollLoop(generation) {
  const doneForNow = await pollTransfer();
  if (generation !== state.pollGeneration) return; // superseded
  if (!doneForNow) {
    state.pollTimer = setTimeout(() => runPollLoop(generation), POLL_INTERVAL_MS);
  }
}

// Statuses where the agent has nothing left to do until a human acts —
// mirrors isWaitingOnHuman() in lib/domain/agentStep.ts. Matching this list
// lets the frontend stop polling immediately instead of waiting for the
// step endpoint's `skipped: true` echo one tick later.
const WAITING_ON_HUMAN_STATUSES = new Set(["awaiting_reply", "locked", "errored", "completed"]);

// Drives one agent turn and refreshes the console/log — one mechanism
// serves both jobs (PRD Section 7/8). Returns true once there's nothing
// left to do until a human acts, so the caller knows to stop rescheduling.
async function pollTransfer() {
  const id = state.selectedTransferId;
  if (id == null) return true;
  let result;
  try {
    result = await api(`/transfers/${id}/step`, { method: "POST" });
  } catch (err) {
    console.error("step failed", err);
    return false; // transient failure — try again next tick
  }

  if (result.skipped) {
    // No turn executed, nothing changed server-side — skip the re-renders.
    // "turn_in_flight" means another /step call is mid-turn (the server's
    // per-transfer lock refused us), so keep polling to pick up its result;
    // anything else means the agent is waiting on a human, so stop.
    return result.skippedReason !== "turn_in_flight";
  }

  await refreshDetail(id);
  await loadSites(); // stock may have changed (dispatch_courier)
  await loadTransfers();

  return WAITING_ON_HUMAN_STATUSES.has(result.status);
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
// Human input restarts the loop; refresh the detail pane right away too so
// the new message/override shows before the agent's first turn finishes.
function onHumanInput() {
  if (state.selectedTransferId != null) refreshDetail(state.selectedTransferId);
  startPolling();
}
initManagerReply({ getSelectedTransferId: () => state.selectedTransferId, onSent: onHumanInput });
initRegionalOverride({ getSelectedTransferId: () => state.selectedTransferId, onResolved: onHumanInput });

loadSites();
loadTransfers();
setInterval(loadTransfers, 4000);
