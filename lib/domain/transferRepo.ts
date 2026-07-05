import { sql } from "../db.js";
import type { HardwareType } from "./sites.js";

export type TransferStatus =
  | "sourcing"
  | "awaiting_reply"
  | "locked"
  | "deadlock"
  | "errored"
  | "in_transit"
  | "completed";

export interface TransferRow {
  id: number;
  receiverSiteId: string;
  donorSiteId: string | null;
  hardwareType: HardwareType;
  quantity: number;
  status: TransferStatus;
  declinedSiteIds: string[];
  pushbackCount: number;
  escalationSent: boolean;
  dispatchedAt: string | null;
  estimatedArrivalAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTransfer(row: any): TransferRow {
  return {
    id: row.id,
    receiverSiteId: row.receiver_site_id,
    donorSiteId: row.donor_site_id,
    hardwareType: row.hardware_type,
    quantity: row.quantity,
    status: row.status,
    declinedSiteIds: row.declined_site_ids ?? [],
    pushbackCount: row.pushback_count,
    escalationSent: row.escalation_sent,
    dispatchedAt: row.dispatched_at,
    estimatedArrivalAt: row.estimated_arrival_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTransfer(params: {
  receiverSiteId: string;
  hardwareType: HardwareType;
  quantity: number;
}): Promise<TransferRow> {
  const rows = await sql(
    `INSERT INTO transfers (receiver_site_id, hardware_type, quantity) VALUES ($1,$2,$3) RETURNING *`,
    [params.receiverSiteId, params.hardwareType, params.quantity]
  );
  return rowToTransfer(rows[0]);
}

export async function getTransfer(id: number): Promise<TransferRow | null> {
  const rows = await sql("SELECT * FROM transfers WHERE id = $1", [id]);
  return rows[0] ? rowToTransfer(rows[0]) : null;
}

export async function listTransfers(): Promise<TransferRow[]> {
  const rows = await sql("SELECT * FROM transfers ORDER BY created_at DESC");
  return rows.map(rowToTransfer);
}

// Lazy arrival check (#43, ADR-0002 pattern — no cron/background process):
// atomically claims every in_transit Transfer whose simulated arrival has
// passed by flipping it straight to completed in one conditional UPDATE, the
// same claim-then-act shape as claimTurn above. The WHERE clause means two
// concurrent callers (e.g. GET /transfers and GET /sites racing) can never
// both claim the same row, so the caller's post-claim stock move can never
// run twice for one Transfer.
export async function claimArrivedTransfers(): Promise<TransferRow[]> {
  const rows = await sql(
    `UPDATE transfers
     SET status = 'completed', updated_at = now()
     WHERE status = 'in_transit' AND estimated_arrival_at <= now()
     RETURNING *`
  );
  return rows.map(rowToTransfer);
}

// Per-transfer turn lock (#9): only one /step turn may execute at a time
// for a given Transfer. The claim is a single conditional UPDATE, so two
// overlapping /step calls race at the database, not in JS — exactly one
// gets the row back; the loser sees null and must not run a turn. A lock
// older than `staleAfterSeconds` is treated as abandoned (a crashed
// serverless invocation can never release) and may be re-claimed.
//
// Returns the claimed row (post-claim state, so callers decide off fresh
// data, not a pre-claim snapshot) plus the claim timestamp, which acts as
// a token: release only clears the lock if it still holds *our* claim, so
// a slow turn whose stale lock was legitimately stolen can't wipe out the
// thief's lock on its way out.
export async function claimTurn(
  id: number,
  staleAfterSeconds = 60
): Promise<{ transfer: TransferRow; claimToken: string } | null> {
  // The token round-trips as Postgres text (not a driver-parsed Date):
  // JS Date only keeps milliseconds while now() stores microseconds, so a
  // parsed value would never compare equal again on release.
  const rows = await sql(
    `UPDATE transfers SET turn_started_at = now()
     WHERE id = $1
       AND (turn_started_at IS NULL OR turn_started_at < now() - make_interval(secs => $2))
     RETURNING *, turn_started_at::text AS claim_token`,
    [id, staleAfterSeconds]
  );
  if (!rows[0]) return null;
  return { transfer: rowToTransfer(rows[0]), claimToken: rows[0].claim_token };
}

export async function releaseTurn(id: number, claimToken: string): Promise<void> {
  await sql(
    "UPDATE transfers SET turn_started_at = NULL WHERE id = $1 AND turn_started_at = $2::timestamptz",
    [id, claimToken]
  );
}

export async function setTransferStatus(id: number, status: TransferStatus): Promise<void> {
  await sql("UPDATE transfers SET status = $1, updated_at = now() WHERE id = $2", [status, id]);
}

export async function setTransferDonor(id: number, donorSiteId: string): Promise<void> {
  await sql("UPDATE transfers SET donor_site_id = $1, updated_at = now() WHERE id = $2", [donorSiteId, id]);
}

// Called once by dispatch_courier (#38): stamps dispatched_at at the DB's
// clock and derives estimated_arrival_at from the already-computed ETA plus
// a one-time jitter (in seconds, positive or negative) — never re-rolled on
// later reads, so repeated fetches of the same Transfer see the same value.
export async function recordDispatch(
  id: number,
  etaSecondsWithJitter: number
): Promise<{ dispatchedAt: string; estimatedArrivalAt: string }> {
  const rows = await sql(
    `UPDATE transfers
     SET dispatched_at = now(),
         estimated_arrival_at = now() + make_interval(secs => $2),
         updated_at = now()
     WHERE id = $1
     RETURNING dispatched_at, estimated_arrival_at`,
    [id, etaSecondsWithJitter]
  );
  if (!rows[0]) throw new Error(`No such Transfer: ${id}`);
  return { dispatchedAt: rows[0].dispatched_at, estimatedArrivalAt: rows[0].estimated_arrival_at };
}

// Concession Protocol re-routing (Q7/Q8): append to the exclusion list
// rather than creating a new Transfer row. Doesn't touch donor_site_id —
// select_donor (lib/tools/transferApi.ts) already owns that field and is
// always called in the same turn as (or before) this.
export async function declineDonor(id: number, donorSiteId: string): Promise<void> {
  await sql(
    `UPDATE transfers
     SET declined_site_ids = array_append(declined_site_ids, $1), updated_at = now()
     WHERE id = $2`,
    [donorSiteId, id]
  );
}

// Escalation Protocol round cap (Q10) — called from agentStep.ts when the
// agent re-issues a Firmness reply that was already sent once before on
// this Transfer. Re-issuing it *is* the rejection signal (the manager
// pushed back again on the same cited metrics); a reply endpoint can't
// tell agreement from rejection just by looking at when it arrived, so
// that judgment stays with the agent's own turn, not reply.ts. Returns the
// new count and whether it just crossed the deadlock cap.
export async function recordFirmnessPushback(id: number): Promise<{ pushbackCount: number; deadlocked: boolean }> {
  const rows = await sql(
    `UPDATE transfers SET pushback_count = pushback_count + 1, updated_at = now()
     WHERE id = $1 RETURNING pushback_count`,
    [id]
  );
  const pushbackCount = rows[0]?.pushback_count ?? 0;
  const deadlocked = pushbackCount >= 2;
  if (deadlocked) await setTransferStatus(id, "deadlock");
  return { pushbackCount, deadlocked };
}

// How many manager replies have arrived since the Firmness Protocol was
// first invoked on this Transfer (across any donor — Deadlock is scoped to
// the whole Transfer per CONTEXT.md, not one donor attempt)? Comparing this
// to `pushback_count` (see agentStep.ts) tells the agent's current turn
// whether it owes an increment, regardless of how many turns it takes to
// react to a reply or which protocol stage label it ends up picking —
// pushback_count must advance exactly once per distinct manager reply,
// mechanically (CONTEXT.md: "a fixed round cap, not a judgment call made
// fresh each time"), not once per tool call the agent happens to make.
export async function countManagerRepliesSinceFirstFirmness(transferId: number): Promise<number> {
  const rows = await sql(
    `SELECT COUNT(*)::int AS count FROM messages
     WHERE transfer_id = $1 AND sender = 'manager'
     AND created_at > (
       SELECT MIN(created_at) FROM agent_steps
       WHERE transfer_id = $1 AND tool_name = 'send_email' AND tool_args->>'stage' IN ('firmness_lock', 'escalation')
     )`,
    [transferId]
  );
  return rows[0]?.count ?? 0;
}

export async function markEscalationSent(id: number): Promise<void> {
  await sql("UPDATE transfers SET escalation_sent = TRUE, updated_at = now() WHERE id = $1", [id]);
}

export interface MessageRow {
  sender: "agent" | "manager" | "regional_director";
  body: string;
  createdAt: string;
}

export async function getMessages(transferId: number): Promise<MessageRow[]> {
  const rows = await sql(
    "SELECT sender, body, created_at FROM messages WHERE transfer_id = $1 ORDER BY created_at ASC",
    [transferId]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({ sender: r.sender, body: r.body, createdAt: r.created_at }));
}

export async function addManagerMessage(transferId: number, body: string): Promise<void> {
  await sql(`INSERT INTO messages (transfer_id, sender, body) VALUES ($1, 'manager', $2)`, [transferId, body]);
}

export async function logAgentStep(params: {
  transferId: number;
  thought: string;
  toolName: string;
  toolArgs: unknown;
  toolResult: unknown;
}): Promise<void> {
  await sql(
    `INSERT INTO agent_steps (transfer_id, thought, tool_name, tool_args, tool_result) VALUES ($1,$2,$3,$4,$5)`,
    [params.transferId, params.thought, params.toolName, JSON.stringify(params.toolArgs), JSON.stringify(params.toolResult)]
  );
}

export async function getAgentSteps(transferId: number) {
  const rows = await sql(
    "SELECT thought, tool_name, tool_args, tool_result, created_at FROM agent_steps WHERE transfer_id = $1 ORDER BY created_at ASC",
    [transferId]
  );
  return rows;
}
