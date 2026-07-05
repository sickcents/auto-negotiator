export const SITE_TYPE_LABEL = {
  XL: "Regional hub",
  L: "High-traffic donor",
  M: "Standard donor/receiver",
  S: "Express receiver",
};

// TransferStatus -> { label, tone } — tone maps to a .status-pill--<tone> class.
export const STATUS_META = {
  sourcing: { label: "Sourcing donor", tone: "neutral" },
  awaiting_reply: { label: "Awaiting reply", tone: "info" },
  locked: { label: "Locked", tone: "ink" },
  deadlock: { label: "Deadlocked", tone: "signal" },
  errored: { label: "Errored", tone: "signal" },
  in_transit: { label: "In transit", tone: "transit" },
  completed: { label: "Completed", tone: "done" },
};

export function statusMeta(status) {
  return STATUS_META[status] ?? { label: status, tone: "neutral" };
}

// Shared timestamp formatter for Agent Timeline events (#37) -- the incident
// trigger, agent turns, Manager Replies, and Regional Director actions all
// go through this instead of an ad hoc `new Date(...)` per call site, so
// they read consistently. Month + day (not just time) because a Transfer's
// history can span more than one day.
export function formatEventTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Shared one-line description of a Transfer — the Transfer Detail header
// (#29) reuses this verbatim so it reads as the same row expanded, not a
// second, differently-worded description of the same transfer.
export function transferSummary(t) {
  return `${t.receiverSiteId} needs ${t.quantity}x ${t.hardwareType}${t.donorSiteId ? ` from ${t.donorSiteId}` : ""}`;
}

// Statuses where a Transfer still has an open donor route worth drawing on the map.
export const ACTIVE_ROUTE_STATUSES = new Set([
  "sourcing",
  "awaiting_reply",
  "locked",
  "deadlock",
  "errored",
  "in_transit",
]);
