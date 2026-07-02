# Product Requirements Document (PRD): Auto Negotiator

## 1. Executive Summary
* **Project Name:** Auto Negotiator
* **Concept:** A multi-tool AI agent orchestrating email, calendar, and records APIs to automate procurement negotiation and asset routing end-to-end.
* **Goal:** Eliminate manual back-and-forth on routine hardware requests (scanners and printers) across a regional store network through autonomous, data-driven agent decision-making.
* **Target:** Zero human touchpoints on standard negotiation and logistics cycles.

## 2. Technical Stack
To optimize reliability, latency, and response quality (structured JSON outputs) while keeping portfolio costs negligible:
* **Backend Orchestration:** Node.js / TypeScript, exposed only as JSON endpoints under `/api/*`, deployed to Vercel as stateless serverless functions (viable because Section 4's monitor is inline, not a background thread — [ADR-0002](../adr/0002-trigger-only-monitoring.md)). Chosen over the originally-drafted Python/Flask since nothing in the final architecture required Python — see [ADR-0004](../adr/0004-nodejs-backend-not-flask.md). No HTML rendering here — the dashboard is a separate static layer that fetches from `/api/*`.
* **Database:** Neon (serverless Postgres), project `clickshop`. Required because Vercel functions have no persistent local disk between invocations — SQLite would silently reset state mid-demo. Holds Sites, inventory counts, Transfers, and the mocked mailbox/calendar/ITSM tables from Section 5.
* **LLM Engine:** Gemini (`gemini-3.5-flash` by default) via its OpenAI-compatible endpoint — see [ADR-0006](../adr/0006-gemini-instead-of-groq.md) for why this superseded the original Groq default. Every turn is required to return a `{"thought": "<one sentence>", "tool_call": {...}}` envelope regardless of engine, so the console's reasoning trace is provider-independent rather than depending on a specific model's native reasoning exposure — see [ADR-0005](../adr/0005-enforced-thought-envelope.md).
* **Frontend Dashboard:** Vanilla JavaScript and CSS, served as static files directly from Vercel's CDN (no server-rendered templates), fetching state from the `/api/*` endpoints.
* **UI/UX Aesthetic:** Minimalist, flat, and professional design to clearly visualize system architecture without visual clutter.
* **Secrets:** LLM API key and the Neon connection string live only in Vercel's environment variables (and a local, `.gitignore`d `.env` for dev) — never committed, since this repo is public on GitHub.

## 3. The Operating Environment (ClickShop Network)
The system manages inventory routing for 24-hour convenience stores in Eastern Singapore. The primary hardware assets are Zebra ZQ521 (Printers) and Zebra TC58 (Scanners). Every store is pinned to a real MRT station's coordinates, which double as the geographic backbone for the map view and for donor-distance ranking (see [ADR-0003](../adr/0003-mrt-geography-backs-distance-calc.md)).

`Network Role` is a descriptive default for the site type, not an enforced constraint — actual donor/receiver status for any given `Transfer` is always computed dynamically from real-time surplus vs. each site's `operating_threshold` (see Section 4), never solely from this label. An `M` site can donate today and receive tomorrow.

`Max Scanners`/`Max Printers` are capacity ceilings (storage/repair capacity for `XL`, typical stocked maximum elsewhere). `Operating Threshold` is the static, per-type hard floor below which a site cannot run normally — see Section 4 for how this differs from the dynamic `min_buffer`.

| Site Type | Network Role | Max Scanners | Max Printers | Op. Threshold (Scan/Print) |
| :--- | :--- | :--- | :--- | :--- |
| **XL** | Regional Hub & Repair | 50 | 20 | 15 / 6 |
| **L** | High-Traffic Donor | 20 | 10 | 6 / 3 |
| **M** | Standard Donor/Receiver | 10 | 5 | 3 / 1 |
| **S** | Express Receiver | 5 | 2 | 1 / 1 |

| Store (Site Type) | MRT Waypoint | Lat, Lng |
| :--- | :--- | :--- |
| Tampines Hub (XL) | Tampines | 1.3546, 103.9437 |
| Bedok Central (L) | Bedok | 1.3236, 103.9273 |
| Simei Point (L) | Simei | 1.3431, 103.9532 |
| Paya Lebar Square (L) | Paya Lebar | 1.3180, 103.8925 |
| Pasir Ris Drive (M) | Pasir Ris | 1.3721, 103.9493 |
| Tanah Merah Walk (M) | Tanah Merah | 1.3272, 103.9463 |
| Kembangan Court (M) | Kembangan | 1.3208, 103.9127 |
| Bedok North Ave (M) | Bedok North | 1.3348, 103.9186 |
| Eunos Crescent (S) | Eunos | 1.3197, 103.9030 |
| Aljunied Road (S) | Aljunied | 1.3164, 103.8828 |
| Expo Way (S) | Expo | 1.3352, 103.9613 |
| Upper Changi (S) | Upper Changi | 1.3412, 103.9614 |
| Bedok Reservoir (S) | Bedok Reservoir | 1.3363, 103.9330 |

13 stores total (1 XL, 3 L, 4 M, 5 S) — enough variety that donor ranking has real candidates to choose between instead of one obvious answer. Coordinates are the real MRT station locations; treat this table as a seed dataset, adjust freely.

## 4. System Architecture & Trigger Logic
To prevent continuous, expensive LLM polling, the system uses a strict event-driven architecture. There is no persistent background process — see [ADR-0002](../adr/0002-trigger-only-monitoring.md) for why, which also makes this deployable as a single stateless Vercel app.
* **The Monitor (Rule-Based, inline):** the threshold check is a plain function invoked synchronously whenever inventory changes (e.g. the "Simulate Incident" control, or any future real mutation) — not a standing loop. The Agent Console still narrates it as "checking thresholds..." to preserve the monitoring illusion.
* **Two distinct floors per site, per hardware type:**
  * `operating_threshold` — static, per-site-type hard floor (Section 3 table). The absolute minimum a site needs to function. The Firmness Protocol (Section 6) cites this directly: "your operating threshold is 3, you have 6, releasing 2 leaves you at 4."
  * `min_buffer` — dynamic, recalculated from each site's 7-day trailing average depletion rate. This is the *soft*, early-warning floor that fires the trigger before a site ever nears its hard `operating_threshold`.
* **The Trigger:** the inline monitor fires a JSON payload to the LLM only if a site's `current_stock < min_buffer` or `depletion_rate > critical_threshold` (a leading indicator on the rate of consumption itself, independent of current stock level).
* **Seed history:** a 7-day trailing average can't accumulate from scratch during a live demo, so DB init seeds ~7 days of plausible synthetic daily depletion counts per site per hardware type, generated from a fixed random seed. `min_buffer`/`critical_threshold` are real numbers from the first click, not placeholders, and identical across every reset — the same demo walkthrough is reproducible for repeated interviews/recordings, rather than looking different (or breaking a rehearsed narration) each time the DB is reseeded. "Simulate Incident" then appends on top of this seeded history (a stock drop or a depletion spike).

## 5. Agent Function Calling (Toolbelt)
The agent has access to the following APIs. All of them are mocked/in-process (no real third-party accounts, no OAuth, nothing that needs a secret beyond the LLM API key) — see [ADR-0001](../adr/0001-mocked-integrations-with-live-llm.md) for why, and how this stays honest as a demo rather than becoming a canned script.
* **Inventory API:** Query real-time stock levels, 7-day usage trends, and calculate real distances between sites using haversine distance over the MRT waypoint coordinates in Section 3 ([ADR-0003](../adr/0003-mrt-geography-backs-distance-calc.md)) — this is what actually ranks candidate donor sites, not a hand-assigned tier.
* **Email API:** Draft and "send" emails to/from store managers — writes/reads rows in an in-app mailbox table, rendered in the dashboard; nothing leaves the app.
* **Calendar API:** Check store promotion schedules and peak foot-traffic times from seeded data.
* **Logistics API:** Generate simulated dispatch requests for couriers (e.g., Lalamove/GrabExpress) — logs a synthetic confirmation, no real courier is contacted.
* **ZPL Provisioning API:** Simulate sending raw Zebra Programming Language (ZPL) configuration files to reconfigure printers for the destination site prior to arrival — logs the generated ZPL payload, no real hardware/thin-client is contacted.
* **ITSM API:** Open and close service tickets in-app for audit trails.

## 6. The Negotiation Engine (Handling Pushback)
The agent must demonstrate state management and unstructured-to-structured data translation when human managers reply to automated routing emails. A `Transfer` is one shortage incident, not one donor attempt: its `donor_site_id` can be reassigned mid-negotiation, and every email/reply across every attempted donor is appended to that same Transfer's message history — one card, one growing timeline, one ITSM ticket per incident.
* **Concession Protocol:** If a manager refuses a transfer citing a specific event (e.g., "Huge promo tomorrow"), the agent queries the Calendar API. If verified, the agent concedes and re-runs the same dynamic donor ranking (Section 5), excluding the site(s) that already declined, over *all* site types — Uber-dispatch style, no `Site Type` allowlist. In practice `S`/`XL` sites rarely rank highly since their `operating_threshold` leaves little room for surplus, but nothing formally excludes them. The Transfer's `donor_site_id` is reassigned to the new pick and the negotiation continues on the same record.
* **Firmness Protocol:** If a manager refuses without data-backed justification, the agent queries the 7-day trailing data and the donor site's `operating_threshold`. It replies with hard metrics (e.g., "Your operating threshold is 3; you're at 6; releasing 2 leaves you at 4") and locks the transfer.
* **Escalation Protocol:** each Transfer tracks a `pushback_count`. If the manager rejects an already-issued Firmness reply, or repeats a Concession claim the agent already checked and rejected, `pushback_count` increments; at 2 rejections on the same Transfer, "absolute deadlock" is declared regardless of the reply's content, and the agent posts a synthesized deadlock summary to the mocked Email API addressed to the "Regional Director" persona and surfaces it as a flagged item in the Agent Console/dashboard — there is no real person or external notification, consistent with [ADR-0001](../adr/0001-mocked-integrations-with-live-llm.md). The dashboard shows this as a visible "attempt N of 2" counter on the Transfer.
* **Regional Director Override:** a flagged (deadlocked) Transfer exposes a manual control letting the operator force-approve the current donor or force-reroute to *any* Site, unconstrained by the Section 5 ranking. Unlike the agent's own routing, this can produce a genuinely inefficient pick (e.g. an `XL` hub donating clear across the network to a distant `S` site instead of the nearest ranked candidate). The dashboard shows the resulting route's distance/ETA next to what the top-ranked alternative would have been, so the cost of overriding is visible rather than free — reinforcing why the automated path is preferable when it doesn't deadlock.

## 7. Frontend Dashboard Requirements
The user interface serves as the simulation control panel for the portfolio demonstration. The rule throughout: the LLM calls behind the Agent Console are always genuine, live inference against current data — only the *other side of the conversation* (the store manager) is operator-supplied, never the agent's own reasoning.
* **Map View:** A Singapore map (Eastern region) plotting each store at its real MRT waypoint (Section 3). Selecting a store surfaces its current stock, thresholds, and role in any active `Transfer`. Donor candidates highlighted during an active negotiation are drawn from the same haversine distance calculation the Inventory API actually uses — the map isn't decorative, it's a view onto real ranking data.
* **Network Status View:** Cards per store (grouped by site type) displaying current TC58 and ZQ521 counts against `operating_threshold` and `min_buffer`.
* **Trend Visualization:** A simple sparkline or contribution graph indicating the 7-day depletion trend for each site.
* **Simulation Controls:** A discrete button (e.g., "Simulate Incident") that drops a chosen site's inventory below its `operating_threshold` to trigger the inline monitor check (Section 4).
* **Manager Reply Injection:** once a `Transfer` negotiation email is sent, the dashboard exposes a control for the operator to role-play the donor site's manager: a bank of presets (e.g., "cites a promo," "refuses, no reason," "agrees") plus a free-text box. Both paths feed the identical parsing/protocol logic — there is no special-cased demo path, which is what makes it provable rather than staged (see [ADR-0001](../adr/0001-mocked-integrations-with-live-llm.md)).
* **Agent Console:** A near-real-time log terminal driven by the frontend's short-poll loop (~1-2s, against `/api/*` — no WebSocket/SSE, consistent with the stateless serverless shape in Section 2). Each poll both fetches new log lines *and* drives the next `/api/agent/step` turn (Section 8) — one invocation per turn, never one long-running call for a whole sequence, so no single request risks Vercel's duration limits. Shows the agent's internal reasoning (thought process), function calls, and email communications as they happen.
* **Regional Director Override:** on a deadlocked Transfer card, controls to force-approve the current donor or force-reroute to any Site (Section 6). The chosen route's distance/ETA is shown alongside the top-ranked alternative's, surfacing the efficiency cost of the manual pick rather than hiding it.

## 8. Agent Execution Sequence
Once triggered, the agent runs a strictly sequential loop: one `{"thought", "tool_call"}` turn (Section 2) at a time — thought, single tool call, observe the result, next thought — never parallel calls within a turn. Each turn is its own `/api/agent/step` invocation, driven by the frontend's short-poll loop (reusing the Section 7 Agent Console polling mechanism rather than a second timing model) — not one long-running invocation running the whole sequence, which would risk Vercel's function duration limits. The frontend keeps calling `/api/agent/step` until the response says "waiting for reply" or "done." Every step this workflow describes is one such turn, and one console log line.

**Schema failure handling:** if a turn's output fails envelope validation (malformed JSON, unknown tool name, or a referenced `site_id`/entity that doesn't exist in Neon), the step is retried exactly once with the validation error fed back to the model as context. If the retry also fails, the Transfer is marked `errored` — surfaced in the console and the Regional Director Override flow (Section 6) exactly like a deadlock, rather than retrying indefinitely.
1. **Assess the Shortage:** Analyze the JSON payload from the backend to identify the target site, missing hardware, and minimum operational requirements.
2. **Source Hardware:** Query the Inventory API to identify optimal donor sites based on current surplus, historical usage, and geographic proximity.
3. **Initiate Transfer:** Email the identified donor site manager requesting the transfer, explicitly stating the pickup time based on optimal traffic data via the Calendar API.
4. **Process Human Feedback:** When the operator submits a Manager Reply (Section 7), parse it and execute Concession, Firmness, or Escalation protocols based on its content. The Transfer sits idle in Neon between the initial email and this step — there's no long-running wait, just state persisted until the next inline invocation.
5. **Finalize Logistics:** Once agreed, call the Logistics API to dispatch the courier and the ZPL Provisioning API to push network configurations to the hardware.
6. **Audit & Close:** Generate the final shipping manifest, update the main inventory database to "In-Transit," and close the ITSM ticket.

## 9. Explicit Non-Goals
Deliberate scope cuts, stated so they read as intentional rather than gaps:
* **No concurrency control across Transfers.** Donor eligibility (Section 5) reads `current_stock` directly with no reservation/hold mechanism for stock already promised to another in-flight Transfer. The dashboard drives one active Transfer at a time, so the race this would guard against never occurs in the demo; real double-booking protection is out of scope.
* **No real third-party integrations.** Email/Calendar/Logistics/ZPL/ITSM are in-process mocks — see [ADR-0001](../adr/0001-mocked-integrations-with-live-llm.md).
* **No persistent background process.** Threshold checks are inline, not a standing monitor loop — see [ADR-0002](../adr/0002-trigger-only-monitoring.md).