// NetworkStatusPanel — a SiteCard per store, grouped implicitly by the
// XL/L/M/S value scale (dot color) rather than a separate legend.

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
        <span class="site-card__dot" aria-hidden="true"></span>
        ${site.siteType} · ${site.mrtWaypoint} MRT
      </p>
      <h3 class="site-card__name">${site.name}</h3>
      <div class="site-card__stats">
        ${statRowHtml("Scanners", site.currentScanners, site.operatingThresholdScanners, site.scannerMinBuffer, scannerLow)}
        ${statRowHtml("Printers", site.currentPrinters, site.operatingThresholdPrinters, site.printerMinBuffer, printerLow)}
      </div>
    </div>`;
}

function statRowHtml(label, current, threshold, buffer, isLow) {
  return `<div class="site-card__stat ${isLow ? "is-low" : ""}">
    <span class="site-card__stat-label">${label}</span>
    <span class="site-card__stat-value">${current}<span class="site-card__stat-sub">/${threshold} floor · buf ${buffer}</span></span>
  </div>`;
}
