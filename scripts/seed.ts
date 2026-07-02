// Deterministic seed: 13 MRT-pinned stores + 7 days of synthetic depletion
// history, generated from a fixed RNG seed (design-session Q20) so the demo
// is reproducible across resets rather than looking different every time.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { sql } from "../lib/db.js";
import { SITES, SITE_TYPE_CONFIG } from "../lib/domain/sites.js";
import { createSeededRng, randomInt } from "../lib/domain/rng.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED = process.env.SEED_RNG_SEED ?? "clickshop-demo-v1";
const HISTORY_DAYS = 7;

async function applySchema() {
  const schemaSql = readFileSync(path.join(__dirname, "../lib/schema.sql"), "utf-8");
  // Neon's HTTP driver runs one statement per call; split on `;` at
  // statement boundaries (schema.sql has no semicolons inside string literals).
  const statements = schemaSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    await sql(statement);
  }
}

async function clearExistingData() {
  await sql("DELETE FROM agent_steps");
  await sql("DELETE FROM messages");
  await sql("DELETE FROM tickets");
  await sql("DELETE FROM transfers");
  await sql("DELETE FROM depletion_log");
  await sql("DELETE FROM calendar_events");
  await sql("DELETE FROM sites");
}

async function seedSites(rng: () => number) {
  for (const site of SITES) {
    const config = SITE_TYPE_CONFIG[site.siteType];
    // Start each site healthy (above operating_threshold + a rough buffer
    // margin) — the "Simulate Incident" control is what creates a shortage,
    // not the initial seed.
    const currentScanners = randomInt(
      rng,
      config.operatingThresholdScanners + 1,
      config.maxScanners
    );
    const currentPrinters = randomInt(
      rng,
      config.operatingThresholdPrinters + 1,
      config.maxPrinters
    );

    await sql(
      `INSERT INTO sites (
        id, name, site_type, network_role, mrt_waypoint, lat, lng,
        max_scanners, max_printers,
        operating_threshold_scanners, operating_threshold_printers,
        current_scanners, current_printers
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        site.id,
        site.name,
        site.siteType,
        config.networkRole,
        site.mrtWaypoint,
        site.lat,
        site.lng,
        config.maxScanners,
        config.maxPrinters,
        config.operatingThresholdScanners,
        config.operatingThresholdPrinters,
        currentScanners,
        currentPrinters,
      ]
    );
  }
}

async function seedDepletionHistory(rng: () => number) {
  const today = new Date();
  for (const site of SITES) {
    const config = SITE_TYPE_CONFIG[site.siteType];
    for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - daysAgo);
      const dayStr = day.toISOString().slice(0, 10);

      const scannerDepletion = randomInt(rng, 0, config.criticalDepletionRateScanners);
      const printerDepletion = randomInt(rng, 0, config.criticalDepletionRatePrinters);

      await sql(
        `INSERT INTO depletion_log (site_id, hardware_type, day, depleted) VALUES ($1,'scanner',$2,$3)`,
        [site.id, dayStr, scannerDepletion]
      );
      await sql(
        `INSERT INTO depletion_log (site_id, hardware_type, day, depleted) VALUES ($1,'printer',$2,$3)`,
        [site.id, dayStr, printerDepletion]
      );
    }
  }
}

// A couple of hardcoded near-term events (rather than randomized) so an
// operator demoing the Concession Protocol knows exactly which site's
// manager can legitimately claim "huge promo tomorrow" (PRD Section 6).
async function seedCalendarEvents() {
  const inDays = (n: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const events: Array<{ siteId: string; eventDate: string; description: string; peakTraffic: boolean }> = [
    { siteId: "bedok-central", eventDate: inDays(1), description: "Huge storewide promo", peakTraffic: true },
    { siteId: "paya-lebar-square", eventDate: inDays(3), description: "Weekend foot-traffic peak", peakTraffic: true },
  ];

  for (const event of events) {
    await sql(
      `INSERT INTO calendar_events (site_id, event_date, description, peak_traffic) VALUES ($1,$2,$3,$4)`,
      [event.siteId, event.eventDate, event.description, event.peakTraffic]
    );
  }
}

async function main() {
  console.log(`Applying schema...`);
  await applySchema();

  console.log(`Clearing existing data...`);
  await clearExistingData();

  console.log(`Seeding ${SITES.length} sites and ${HISTORY_DAYS} days of depletion history (seed="${SEED}")...`);
  const rng = createSeededRng(SEED);
  await seedSites(rng);
  await seedDepletionHistory(rng);
  await seedCalendarEvents();

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
