// Two distinct floors per site, per hardware type (PRD Section 4):
// operating_threshold is static (SITE_TYPE_CONFIG); min_buffer is dynamic,
// derived here from the 7-day trailing depletion history.

const SAFETY_DAYS_COVER = 2;

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Soft, early-warning floor: enough stock to cover ~2 days at the recent
// average depletion rate. Crossing it (while still above operating_threshold)
// fires the trigger.
export function computeMinBuffer(trailingDailyDepletions: readonly number[]): number {
  return Math.ceil(average(trailingDailyDepletions) * SAFETY_DAYS_COVER);
}

// Leading indicator: the rate of consumption itself, independent of current
// stock level. Compared against SiteTypeConfig.criticalDepletionRate*.
export function computeDepletionRate(trailingDailyDepletions: readonly number[]): number {
  return average(trailingDailyDepletions);
}
