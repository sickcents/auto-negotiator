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

// Statuses where a Transfer still has an open donor route worth drawing on the map.
export const ACTIVE_ROUTE_STATUSES = new Set([
  "sourcing",
  "awaiting_reply",
  "locked",
  "deadlock",
  "errored",
  "in_transit",
]);
