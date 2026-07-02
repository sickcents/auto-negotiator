// NetworkStatusPanel — a SiteCard per store, grouped implicitly by the
// XL/L/M/S value scale (badge color) rather than a separate legend.

export function renderNetworkStatus(sites) {
  const container = document.getElementById("site-cards");
  container.innerHTML = sites.map(siteCardHtml).join("");
}

function siteCardHtml(site) {
  const scannerLow = site.currentScanners < site.scannerMinBuffer;
  const printerLow = site.currentPrinters < site.printerMinBuffer;
  return `
    <div class="site-card type-${site.siteType}">
      <p class="site-card__eyebrow">
        <span class="site-card__badge">[${site.siteType}]</span>
        ${site.mrtWaypoint} MRT
      </p>
      <h3 class="site-card__name">${site.name}</h3>
      <div class="site-card__stats">
        ${statRowHtml("Scanners", site.currentScanners, site.operatingThresholdScanners, site.scannerMinBuffer, scannerLow)}
        ${statRowHtml("Printers", site.currentPrinters, site.operatingThresholdPrinters, site.printerMinBuffer, printerLow)}
      </div>
    </div>`;
}

function statRowHtml(label, current, threshold, buffer, isLow) {
  const max = Math.max(current, threshold, buffer) * 1.15 || 1;
  const currentPct = pct(current, max);
  const thresholdPct = pct(threshold, max);
  const bufferPct = pct(buffer, max);
  return `<div class="site-card__stat ${isLow ? "is-low" : ""}">
    <div class="site-card__stat-head">
      <span class="site-card__stat-label">${label}</span>
      <span class="site-card__stat-current">${current}</span>
    </div>
    <div
      class="site-card__gauge"
      role="img"
      aria-label="${label}: ${current} current, ${threshold} operating threshold, ${buffer} min buffer"
    >
      <span class="site-card__gauge-fill" style="width:${currentPct}%"></span>
      <span
        class="site-card__gauge-mark site-card__gauge-mark--threshold"
        style="left:${thresholdPct}%"
        title="Operating Threshold: ${threshold}"
      ></span>
      <span
        class="site-card__gauge-mark site-card__gauge-mark--buffer"
        style="left:${bufferPct}%"
        title="Min Buffer: ${buffer}"
      ></span>
    </div>
    <div class="site-card__stat-legend">
      <span>Op. Threshold <b>${threshold}</b></span>
      <span>Min Buffer <b>${buffer}</b></span>
    </div>
  </div>`;
}

function pct(value, max) {
  return Math.min(100, Math.max(0, (value / max) * 100));
}
