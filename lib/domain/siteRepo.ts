import { sql } from "../db.js";
import type { SiteType, HardwareType } from "./sites.js";

export interface SiteRow {
  id: string;
  name: string;
  siteType: SiteType;
  networkRole: string;
  mrtWaypoint: string;
  lat: number;
  lng: number;
  maxScanners: number;
  maxPrinters: number;
  operatingThresholdScanners: number;
  operatingThresholdPrinters: number;
  currentScanners: number;
  currentPrinters: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSite(row: any): SiteRow {
  return {
    id: row.id,
    name: row.name,
    siteType: row.site_type,
    networkRole: row.network_role,
    mrtWaypoint: row.mrt_waypoint,
    lat: Number(row.lat),
    lng: Number(row.lng),
    maxScanners: row.max_scanners,
    maxPrinters: row.max_printers,
    operatingThresholdScanners: row.operating_threshold_scanners,
    operatingThresholdPrinters: row.operating_threshold_printers,
    currentScanners: row.current_scanners,
    currentPrinters: row.current_printers,
  };
}

export async function getAllSites(): Promise<SiteRow[]> {
  const rows = await sql("SELECT * FROM sites ORDER BY id");
  return rows.map(rowToSite);
}

export async function getSite(siteId: string): Promise<SiteRow | null> {
  const rows = await sql("SELECT * FROM sites WHERE id = $1", [siteId]);
  return rows[0] ? rowToSite(rows[0]) : null;
}

export async function getTrailingDepletion(
  siteId: string,
  hardwareType: HardwareType,
  days = 7
): Promise<number[]> {
  const rows = await sql(
    `SELECT depleted FROM depletion_log
     WHERE site_id = $1 AND hardware_type = $2
     ORDER BY day DESC LIMIT $3`,
    [siteId, hardwareType, days]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => r.depleted as number);
}

export async function adjustStock(
  siteId: string,
  hardwareType: HardwareType,
  delta: number
): Promise<void> {
  const column = hardwareType === "scanner" ? "current_scanners" : "current_printers";
  await sql(`UPDATE sites SET ${column} = ${column} + $1 WHERE id = $2`, [delta, siteId]);
}

export async function setStock(siteId: string, hardwareType: HardwareType, value: number): Promise<void> {
  const column = hardwareType === "scanner" ? "current_scanners" : "current_printers";
  await sql(`UPDATE sites SET ${column} = $1 WHERE id = $2`, [value, siteId]);
}
