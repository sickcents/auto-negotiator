// AgentTimeline — renders the agent-step / message history for the selected
// Transfer as a vertical timeline, grouped into sections by the negotiation
// state (STATUS_META, public/js/format.js) each event happened in.
//
// Every turn reads as ONE complete step: a collapsible reasoning block plus a
// domain-specific card for whatever tool the agent called that turn (an email
// document for send_email, a donor table for rank_donors, a dispatch/ZPL/
// ticket card, or a readable generic fallback). All LLM- and human-authored
// text (thoughts, email bodies, manager replies) is run through the
// escape-first Markdown renderer (public/js/markdown.js) before it reaches the
// DOM — nothing is ever interpolated raw. A plain-text mirror is kept for the
// Copy button.

import { STATUS_META, statusMeta } from "../format.js";
import { icon } from "../icons.js";
import { escapeHtml, renderMarkdown } from "../markdown.js";

const STATUS_ORDER = Object.keys(STATUS_META);

let consoleText = "";
let openGroups = new Set(STATUS_ORDER);
let thoughtOverrides = new Map(); // created_at -> user's explicit open/closed choice
let lastTransferId = null;
let toggleListenerAttached = false;

export function renderAgentConsole(agentSteps, messages, { currentStatus, transferId } = {}) {
  if (transferId !== lastTransferId) {
    lastTransferId = transferId;
    openGroups = new Set(STATUS_ORDER); // fresh transfer selection -> fresh defaults
    thoughtOverrides = new Map();
  }

  const events = mergeEvents(agentSteps, messages);

  // Only the newest turn's reasoning is expanded by default; older turns stay
  // collapsed unless the viewer opened them (tracked in thoughtOverrides).
  const stepKeys = events.filter((e) => e.kind === "step" && e.thought).map((e) => e.created_at);
  const ctx = {
    latestThoughtKey: stepKeys.length ? stepKeys[stepKeys.length - 1] : null,
    isThoughtOpen(key) {
      if (thoughtOverrides.has(key)) return thoughtOverrides.get(key);
      return key === ctx.latestThoughtKey;
    },
  };

  const groups = groupByStatus(events, currentStatus);

  const consoleEl = document.getElementById("agent-timeline");
  ensureToggleListener(consoleEl);

  const scrollTop = consoleEl.scrollTop; // preserve position across poll re-renders
  const sections = STATUS_ORDER.filter((status) => groups.has(status)).map((status) => groupHtml(status, groups.get(status), ctx));
  consoleEl.innerHTML = sections.join("") || `<p class="hint">No agent activity yet.</p>`;
  consoleEl.scrollTop = scrollTop;

  consoleText = events.map(eventText).join("\n\n");
}

export function initConsoleCopy() {
  document.getElementById("console-copy-btn").addEventListener("click", async () => {
    const btn = document.getElementById("console-copy-btn");
    try {
      await navigator.clipboard.writeText(consoleText);
      btn.textContent = "Copied!";
    } catch {
      btn.textContent = "Copy failed";
    }
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });
}

// <details>'s "toggle" event doesn't bubble, but it IS visible to a
// capture-phase listener on an ancestor — attached once (the element itself
// survives across renders even though its innerHTML doesn't), so a viewer's
// expanded/collapsed groups AND per-turn thoughts aren't reset by a full
// re-render. Status groups carry data-status; turn thoughts carry
// data-thought; the inline result <details> carry neither and are ignored.
function ensureToggleListener(consoleEl) {
  if (toggleListenerAttached) return;
  toggleListenerAttached = true;
  consoleEl.addEventListener(
    "toggle",
    (event) => {
      const el = event.target;
      if (el.dataset?.status) {
        if (el.open) openGroups.add(el.dataset.status);
        else openGroups.delete(el.dataset.status);
      } else if (el.dataset?.thought) {
        thoughtOverrides.set(el.dataset.thought, el.open);
      }
    },
    true
  );
}

// Agent messages are the mirror of send_email turns (sendEmailTool writes the
// same body into `messages`); the send_email step already renders that body as
// an email document, so drop the duplicate here to keep exactly one entry per
// turn. Manager replies and Regional Director overrides have no backing step
// and are kept.
function mergeEvents(agentSteps, messages) {
  return [
    ...agentSteps.map((s) => ({ kind: "step", at: s.created_at, ...s })),
    ...messages
      .filter((m) => m.sender !== "agent")
      .map((m) => ({ kind: "message", at: m.createdAt ?? m.created_at, ...m })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));
}

// agent_steps/messages don't carry a status column (Q: "not a new API") --
// this replays the same deterministic tool_name -> status transitions the
// backend applies (lib/domain/agentStep.ts's decideNextStatus and
// lib/domain/regionalOverride.ts's resolveOverride) purely to decide which
// section an event belongs to -- with one deliberate deviation: unmatched
// (info-gathering) tool calls stay in the current group instead of
// decideNextStatus's literal "sourcing" default, which reads better for a
// display grouping than resetting phase on every query_inventory call.
function groupByStatus(events, actualCurrentStatus) {
  const groups = new Map();
  let currentStatus = "sourcing";
  for (const e of events) {
    if (!groups.has(currentStatus)) groups.set(currentStatus, []);
    groups.get(currentStatus).push(e);
    if (e.kind === "step") currentStatus = nextStatusAfterStep(currentStatus, e);
  }

  // The deadlock pushback counter isn't derivable from steps/messages alone,
  // so the replay above can drift from the transfer's real status. If it does,
  // trust the API's status for the most recently active group.
  if (actualCurrentStatus && groups.size && currentStatus !== actualCurrentStatus) {
    const drifted = groups.get(currentStatus) ?? [];
    groups.delete(currentStatus);
    groups.set(actualCurrentStatus, [...(groups.get(actualCurrentStatus) ?? []), ...drifted]);
  }

  return groups;
}

function nextStatusAfterStep(currentStatus, step) {
  if (step.tool_name === "regional_director_override") return "completed";
  if (step.tool_name === "none") {
    const result = normalize(step.tool_result);
    if (result && typeof result === "object") {
      if ("final" in result) return result.final;
      if ("error" in result) return "errored";
    }
    return currentStatus;
  }
  if (step.tool_name === "send_email") {
    const args = normalize(step.tool_args);
    const stage = args?.stage ?? "initial";
    if (stage === "firmness_lock") return "locked";
    if (stage === "escalation") return currentStatus;
    return "awaiting_reply";
  }
  if (step.tool_name === "dispatch_courier") return "in_transit";
  if (step.tool_name === "close_ticket") return "completed";
  // Info-gathering calls (rank_donors, query_inventory, open_ticket, ...)
  // don't move the needle — group them with whichever phase they're actually
  // happening in rather than resetting to "sourcing".
  return currentStatus;
}

function groupHtml(status, events, ctx) {
  const meta = statusMeta(status);
  const open = openGroups.has(status) ? "open" : "";
  return `<details class="timeline-group" data-status="${status}" ${open}>
    <summary class="timeline-group__label status-pill status-pill--${meta.tone}">${icon("caret-right", "timeline-group__caret")}${escapeHtml(meta.label)}</summary>
    <div class="timeline-group__events">${events.map((e) => eventHtml(e, ctx)).join("")}</div>
  </details>`;
}

// ---------------------------------------------------------------------------
// Per-event rendering
// ---------------------------------------------------------------------------

function eventHtml(e, ctx) {
  if (e.kind === "message") return messageHtml(e);
  return `<article class="turn">${thoughtHtml(e, ctx)}${toolCardHtml(e)}</article>`;
}

function thoughtHtml(step, ctx) {
  if (!step.thought) return "";
  const key = step.created_at;
  const open = ctx.isThoughtOpen(key) ? "open" : "";
  return `<details class="turn-thought" data-thought="${escapeHtml(key)}" ${open}>
    <summary class="turn-thought__summary">${icon("caret-right", "turn-thought__caret")}<span>Reasoning</span></summary>
    <div class="turn-thought__body md">${renderMarkdown(step.thought)}</div>
  </details>`;
}

function toolCardHtml(step) {
  const args = normalize(step.tool_args) ?? {};
  const result = normalize(step.tool_result);
  switch (step.tool_name) {
    case "send_email":
      return emailCard(args, result);
    case "rank_donors":
      return rankDonorsCard(args, result);
    case "dispatch_courier":
      return dispatchCard(args, result);
    case "push_zpl_config":
      return zplCard(args, result);
    case "open_ticket":
      return ticketCard("open", result);
    case "close_ticket":
      return ticketCard("close", result);
    case "none":
      return outcomeCard(result);
    default:
      return genericCard(step.tool_name, args, result);
  }
}

// --- send_email + inbound replies render as email documents ---------------

const EMAIL_STAGE = {
  initial: { to: "Donor site manager", subject: "Hardware transfer request", badge: "Initial request" },
  firmness_lock: { to: "Donor site manager", subject: "Firmness Protocol — request stands", badge: "Firmness lock" },
  escalation: { to: "Regional Director", subject: "Escalation: negotiation deadlock", badge: "Escalation" },
};

const REPLY_META = {
  manager: { from: "Donor site manager", badge: "Reply" },
  regional_director: { from: "Regional Director", badge: "Override" },
};

function emailCard(args, result) {
  const stage = args.stage ?? "initial";
  const meta = EMAIL_STAGE[stage] ?? EMAIL_STAGE.initial;
  const rows = [
    docRow("From", "Auto-Negotiator Agent"),
    docRow("To", meta.to),
    docRow("Subject", meta.subject),
  ].join("");
  return emailDoc({ rows, badge: meta.badge, badgeMod: stage, body: args.body, outbound: true, note: result?.error });
}

function messageHtml(m) {
  const meta = REPLY_META[m.sender] ?? { from: prettyName(m.sender), badge: "Message" };
  const rows = [docRow("From", meta.from), docRow("To", "Auto-Negotiator Agent")].join("");
  return emailDoc({ rows, badge: meta.badge, badgeMod: "inbound", body: m.body, outbound: false });
}

function emailDoc({ rows, badge, badgeMod, body, outbound, note }) {
  const dir = outbound ? "email-doc--outbound" : "email-doc--inbound";
  const noteHtml = note ? `<p class="email-doc__note">${escapeHtml(note)}</p>` : "";
  return `<div class="email-doc ${dir}">
    <div class="email-doc__head">
      ${icon("envelope-simple", "email-doc__icon")}
      <div class="email-doc__meta">${rows}</div>
      <span class="email-doc__badge email-doc__badge--${badgeMod}">${escapeHtml(badge)}</span>
    </div>
    <div class="email-doc__body md">${renderMarkdown(body)}</div>
    ${noteHtml}
  </div>`;
}

function docRow(key, value) {
  return `<div class="email-doc__row"><span class="email-doc__k">${escapeHtml(key)}</span><span class="email-doc__v">${escapeHtml(value)}</span></div>`;
}

// --- rank_donors: ranked donor table --------------------------------------

function rankDonorsCard(args, result) {
  const head = args.hardwareType ? `Ranked donors · ${args.hardwareType} ×${args.quantity ?? ""}` : "Ranked donors";
  if (result?.error) return card("truck", head, errorRow(result.error), "tool-card--donors");

  const candidates = result?.candidates ?? [];
  if (!candidates.length) {
    return card(null, head, `<p class="tool-card__note">No eligible donor sites.</p>`, "tool-card--donors");
  }
  const rows = candidates
    .map(
      (c, i) => `<tr>
        <td class="donor-tbl__rank">${i + 1}</td>
        <td>${escapeHtml(c.siteId)}</td>
        <td class="donor-tbl__num">${escapeHtml(formatKm(c.distanceKm))}</td>
        <td class="donor-tbl__num">+${escapeHtml(String(c.surplus ?? ""))}</td>
      </tr>`
    )
    .join("");
  const table = `<table class="donor-tbl">
    <thead><tr><th>#</th><th>Site</th><th>Distance</th><th>Surplus</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
  return card(null, head, table, "tool-card--donors");
}

// --- dispatch_courier: dispatch confirmation card -------------------------

function dispatchCard(args, result) {
  if (result?.error) return card("truck", "Courier dispatch", errorRow(result.error), "tool-card--dispatch");
  const r = result ?? {};
  const body = kvGrid([
    ["Route", `${args.fromSiteId ?? "?"} → ${args.toSiteId ?? "?"}`],
    ["Payload", `${args.quantity ?? ""} × ${args.hardwareType ?? ""}`],
    ["Courier", r.courier],
    ["Distance", r.distanceKm != null ? `${r.distanceKm} km` : ""],
    ["ETA", r.etaMinutes != null ? `${r.etaMinutes} min` : ""],
    ["Confirmation", r.confirmationId],
    ["Dispatched", formatTime(r.dispatchedAt)],
    ["Est. arrival", formatTime(r.estimatedArrivalAt)],
  ]);
  return card("truck", "Courier dispatched", body, "tool-card--dispatch");
}

// --- push_zpl_config: ZPL payload preview ---------------------------------

function zplCard(args, result) {
  const r = result ?? {};
  if (r.skipped) {
    return card("printer", "ZPL provisioning skipped", `<p class="tool-card__note">${escapeHtml(r.reason ?? "Skipped")}</p>`, "tool-card--zpl");
  }
  const meta = kvGrid([
    ["Target", args.toSiteId],
    ["Hardware", args.hardwareType],
  ]);
  const preview = `<pre class="code-preview">${escapeHtml(r.zplPayload ?? "")}</pre>`;
  return card("printer", "ZPL config pushed", `${meta}${preview}`, "tool-card--zpl");
}

// --- open_ticket / close_ticket: compact status line ----------------------

function ticketCard(kind, result) {
  const r = result ?? {};
  let statusLabel;
  let statusMod;
  let detail = "";
  if (kind === "open") {
    if (r.alreadyOpen) {
      statusLabel = "Already open";
      statusMod = "open";
    } else {
      statusLabel = "Opened";
      statusMod = "open";
      if (r.id != null) detail = `#${r.id}`;
    }
  } else if (r.error) {
    statusLabel = "No ticket";
    statusMod = "error";
    detail = r.error;
  } else {
    statusLabel = "Closed";
    statusMod = "closed";
  }
  const detailHtml = detail ? `<span class="ticket-line__detail">${escapeHtml(detail)}</span>` : "";
  return `<div class="tool-card tool-card--ticket ticket-line">
    ${icon("ticket", "tool-card__icon")}
    <span class="tool-card__title">ITSM ticket</span>
    <span class="ticket-line__status ticket-line__status--${statusMod}">${escapeHtml(statusLabel)}</span>
    ${detailHtml}
  </div>`;
}

// --- tool_name "none": the agent's terminal outcome step ------------------

function outcomeCard(result) {
  const r = result ?? {};
  if (r.error) return card(null, "Halted", errorRow(r.error), "tool-card--outcome");
  if (r.final) {
    const meta = statusMeta(r.final);
    return `<div class="tool-card tool-card--outcome">
      <span class="tool-card__title">Outcome</span>
      <span class="status-pill status-pill--${meta.tone}">${escapeHtml(meta.label)}</span>
    </div>`;
  }
  return card(null, "No action", `<p class="tool-card__note">No tool call this turn.</p>`, "tool-card--outcome");
}

// --- generic fallback (select_donor, query_inventory, check_promotion_...) -

function genericCard(toolName, args, result) {
  const argsGrid = kvGridFromObject(args);
  const resultJson =
    result == null
      ? ""
      : `<details class="tool-json">
          <summary class="tool-json__summary">${icon("caret-right", "tool-json__caret")}<span>Result</span></summary>
          <pre class="code-preview">${escapeHtml(pretty(result))}</pre>
        </details>`;
  return `<div class="tool-card tool-card--generic">
    <div class="tool-card__head"><span class="tool-card__tool">${escapeHtml(prettyName(toolName))}</span></div>
    ${argsGrid}
    ${resultJson}
  </div>`;
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function card(iconName, title, bodyHtml, extraClass = "") {
  const head = `<div class="tool-card__head">${iconName ? icon(iconName, "tool-card__icon") : ""}<span class="tool-card__title">${escapeHtml(title)}</span></div>`;
  return `<div class="tool-card ${extraClass}">${head}${bodyHtml}</div>`;
}

function kvGrid(pairs) {
  return `<div class="kv-grid">${pairs.map(([k, v]) => kv(k, v)).join("")}</div>`;
}

function kvGridFromObject(obj) {
  if (!obj || typeof obj !== "object") return "";
  const entries = Object.entries(obj);
  if (!entries.length) return "";
  return `<div class="kv-grid">${entries
    .map(([k, v]) => kv(prettyName(k), typeof v === "object" && v !== null ? JSON.stringify(v) : v))
    .join("")}</div>`;
}

function kv(key, value) {
  const shown = value == null || value === "" ? "—" : String(value);
  return `<div class="kv"><span class="kv__k">${escapeHtml(key)}</span><span class="kv__v">${escapeHtml(shown)}</span></div>`;
}

function errorRow(message) {
  return `<p class="tool-card__error">${escapeHtml(message)}</p>`;
}

function formatKm(v) {
  // distanceKm arrives as a raw haversine float — full precision bloats the
  // donor table's Distance column right off the card.
  return v == null ? "—" : `${Number(v).toFixed(1)} km`;
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function pretty(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// snake_case / camelCase -> "Title case" for labels.
function prettyName(name) {
  if (!name) return "—";
  const spaced = String(name)
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// tool_args/tool_result are JSONB (usually already-parsed objects), but the
// column has historically been read back as text in some environments, so
// normalise defensively.
function normalize(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

// ---------------------------------------------------------------------------
// Plain-text mirror for the Copy button
// ---------------------------------------------------------------------------

function eventText(e) {
  if (e.kind === "message") {
    const meta = REPLY_META[e.sender] ?? { from: prettyName(e.sender) };
    return `${meta.from}:\n${e.body ?? ""}`;
  }
  const parts = [];
  if (e.thought) parts.push(`Thinking: ${e.thought}`);
  const args = normalize(e.tool_args);
  const result = normalize(e.tool_result);
  if (e.tool_name === "send_email") {
    parts.push(`Email (${args?.stage ?? "initial"}):\n${args?.body ?? ""}`);
  } else if (e.tool_name === "none") {
    if (result?.final) parts.push(`Outcome: ${result.final}`);
    else if (result?.error) parts.push(`Halted: ${result.error}`);
  } else if (e.tool_name) {
    parts.push(`${e.tool_name}(${args ? JSON.stringify(args) : ""}) -> ${result ? JSON.stringify(result) : ""}`);
  }
  return parts.join("\n");
}
