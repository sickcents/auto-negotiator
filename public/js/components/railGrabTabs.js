// Grab-tab visuals for the left rail's drag-to-resize handle (#26/#40). The
// handle's own hit area spans the whole rail so dragging resizes both
// panels' width together, but each panel gets its own visible tab, centered
// on that panel's own height — Transfers and Transfer Detail aren't the
// same height (and Transfers' own height changes depending on whether the
// detail panel is open), so the tabs' vertical position is recomputed
// rather than fixed, and reused across whatever triggers a layout change.
function positionTab(panel, tab) {
  tab.style.top = `${panel.offsetTop + panel.offsetHeight / 2}px`;
}

export function repositionRailGrabTabs() {
  const transfersStrip = document.querySelector(".transfers-strip");
  const detailPanel = document.getElementById("transfer-detail");
  const transfersTab = document.getElementById("transfers-grab-tab");
  const detailTab = document.getElementById("detail-grab-tab");
  if (!transfersStrip || !detailPanel || !transfersTab || !detailTab) return;

  positionTab(transfersStrip, transfersTab);
  detailTab.hidden = detailPanel.hidden;
  if (!detailPanel.hidden) positionTab(detailPanel, detailTab);
}

export function initRailGrabTabs() {
  const transfersStrip = document.querySelector(".transfers-strip");
  const detailPanel = document.getElementById("transfer-detail");
  if (!transfersStrip || !detailPanel) return;

  repositionRailGrabTabs();
  window.addEventListener("resize", repositionRailGrabTabs);
  // Catches the detail panel's open/close transition too (its box goes from
  // none to sized, or back) as well as the Transfers panel's own
  // collapsed/expanded height — both resize this way instead of the rail
  // itself resizing (transferDetail.js also calls repositionRailGrabTabs
  // directly after toggling `hidden`, as a belt-and-suspenders in case a
  // browser doesn't fire ResizeObserver across that display:none edge).
  const observer = new ResizeObserver(repositionRailGrabTabs);
  observer.observe(transfersStrip);
  observer.observe(detailPanel);
}
