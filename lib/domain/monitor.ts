import { getSite, getTrailingDepletion } from "./siteRepo.js";
import { computeMinBuffer, computeDepletionRate } from "./thresholds.js";
import { SITE_TYPE_CONFIG, type HardwareType } from "./sites.js";
import { createTransfer, type TransferRow } from "./transferRepo.js";
import { sql } from "../db.js";

// PRD Section 4 "The Trigger" — inline, synchronous check (ADR-0002), not a
// standing loop. Called at the point of mutation (Simulate Incident).
export async function checkThresholdsAndMaybeCreateTransfer(
  siteId: string,
  hardwareType: HardwareType
): Promise<TransferRow | null> {
  const site = await getSite(siteId);
  if (!site) throw new Error(`No such site: ${siteId}`);

  const history = await getTrailingDepletion(siteId, hardwareType);
  const minBuffer = computeMinBuffer(history);
  const depletionRate = computeDepletionRate(history);
  const config = SITE_TYPE_CONFIG[site.siteType];

  const currentStock = hardwareType === "scanner" ? site.currentScanners : site.currentPrinters;
  const criticalRate =
    hardwareType === "scanner" ? config.criticalDepletionRateScanners : config.criticalDepletionRatePrinters;
  const operatingThreshold =
    hardwareType === "scanner" ? site.operatingThresholdScanners : site.operatingThresholdPrinters;

  const triggered = currentStock < minBuffer || depletionRate > criticalRate;
  if (!triggered) return null;

  // Don't open a second Transfer for a site/hardware pair that already has
  // one in flight (PRD Section 9 non-goal: no concurrency control needed
  // beyond this simple guard, since the demo drives one incident at a time).
  const existing = await sql(
    `SELECT id FROM transfers WHERE receiver_site_id = $1 AND hardware_type = $2
     AND status NOT IN ('completed', 'errored') LIMIT 1`,
    [siteId, hardwareType]
  );
  if (existing.length > 0) return null;

  const quantity = Math.max(1, minBuffer - currentStock + Math.ceil(operatingThreshold / 2));
  return createTransfer({ receiverSiteId: siteId, hardwareType, quantity });
}
