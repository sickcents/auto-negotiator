// NetworkStatusPanel — a SiteCard per store, grouped implicitly by the
// XL/L/M/S value scale (badge color) rather than a separate legend.

export function renderNetworkStatus(sites, activeSiteTypes = null, selectedSiteId = null) {
  const container = document.getElementById("site-cards");
  const visible = activeSiteTypes ? sites.filter((s) => activeSiteTypes.has(s.siteType)) : sites;
  container.innerHTML = visible.map((site) => siteCardHtml(site, site.id === selectedSiteId)).join("");
}

// Card -> map highlight (#19): delegated on the container since cards are
// fully re-rendered (innerHTML) on every poll tick, unlike the static
// filter buttons — a per-card listener would be lost on the next render.
export function initSiteCardSelection({ onSelect }) {
  document.getElementById("site-cards").addEventListener("click", (event) => {
    const card = event.target.closest(".site-card");
    if (card) onSelect(card.dataset.siteId);
  });
}

// Wired once — the filter toggles are static markup, not re-rendered per
// poll tick, so state.siteTypeFilter (owned by main.js) is the only thing
// that changes across refreshes.
export function initSiteFilter({ onChange }) {
  const buttons = [...document.querySelectorAll("#site-filter .site-filter__btn")];
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("is-active");
      btn.setAttribute("aria-pressed", String(btn.classList.contains("is-active")));
      onChange(activeTypesFrom(buttons));
    });
  });
}

function activeTypesFrom(buttons) {
  return new Set(buttons.filter((b) => b.classList.contains("is-active")).map((b) => b.dataset.siteType));
}

function siteCardHtml(site, isSelected = false) {
  const scannerLow = site.currentScanners < site.scannerMinBuffer;
  const printerLow = site.currentPrinters < site.printerMinBuffer;
  return `
    <div class="site-card type-${site.siteType}${isSelected ? " site-card--selected" : ""}" data-site-id="${site.id}">
      <p class="site-card__eyebrow">
        <span class="site-card__badge">${site.siteType}</span>
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
      role="group"
      aria-label="${label}: ${current} current, ${threshold} operating threshold, ${buffer} min buffer"
    >
      <span class="site-card__gauge-fill" style="width:${currentPct}%"></span>
      <span
        class="site-card__gauge-mark site-card__gauge-mark--threshold"
        style="left:${thresholdPct}%"
        tabindex="0"
        aria-label="Operating Threshold: ${threshold}"
      ></span>
      <span
        class="site-card__gauge-mark site-card__gauge-mark--buffer"
        style="left:${bufferPct}%"
        tabindex="0"
        aria-label="Min Buffer: ${buffer}"
      ></span>
    </div>
    <div class="site-card__stat-legend">
      <span class="site-card__stat-legend-item site-card__stat-legend-item--threshold">Op. Threshold <b>${threshold}</b></span>
      <span class="site-card__stat-legend-item site-card__stat-legend-item--buffer">Min Buffer <b>${buffer}</b></span>
    </div>
  </div>`;
}

function pct(value, max) {
  return Math.min(100, Math.max(0, (value / max) * 100));
}
