# Auto Negotiator

An autonomous agent that negotiates hardware transfers (scanners/printers) between ClickShop convenience stores in Eastern Singapore, demonstrated as a portfolio simulation rather than a production integration.

## Language

**Site** (or **Store**):
A ClickShop convenience store location, classified into one `Site Type` (`XL`/`L`/`M`/`S`), pinned to a real MRT station's coordinates.
_Avoid_: Location, branch, shop (used loosely in conversation, but the PRD/code should say Site)

**Site Type**:
The `XL`/`L`/`M`/`S` classification determining a Site's capacity ceilings (`Max Scanners`/`Max Printers`) and its `Operating Threshold`.

**Network Role**:
A descriptive default expectation for a Site Type (e.g. `L` = "High-Traffic Donor"). Not an enforced constraint — a Site's actual donor/receiver behavior in any given `Transfer` is computed dynamically from real-time surplus, not read off this label.
_Avoid_: Using Network Role as if it decides transfer eligibility

**Operating Threshold**:
A static, per-site-type hard floor per hardware type — the absolute minimum stock a Site needs to function. Never crossed voluntarily. The Firmness Protocol cites this number directly when justifying a transfer.
_Avoid_: Minimum, floor (ambiguous with `min_buffer`)

**min_buffer**:
A dynamic, per-site soft floor recalculated from the Site's 7-day trailing average depletion rate. Crossing it (while still above `Operating Threshold`) is what fires the LLM trigger — an early warning, not a hard limit.
_Avoid_: Buffer, threshold (ambiguous with `Operating Threshold`)

**critical_threshold**:
A depletion-*rate* ceiling (not a stock level). If a Site's rate of consumption itself exceeds this, the trigger fires even if current stock is still above `min_buffer` — a leading indicator.

**Transfer**:
The aggregate root for one shortage incident — not one donor attempt. Has exactly one receiver Site (the shortage site) but a reassignable `donor_site_id`: if Concession Protocol fires, the same Transfer gets re-pointed at the next-ranked donor rather than spawning a new record. Every email/Manager Reply across every attempted donor appends to this one Transfer's message history, and it owns exactly one ITSM ticket for its whole lifecycle (open at trigger, close at delivery).
_Avoid_: Treating a donor's decline as ending the Transfer — it only ends that donor's participation in it.

**Deadlock**:
A Transfer's terminal negotiation state, declared after the manager rejects an already-issued Firmness reply, or repeats an already-checked-and-rejected Concession claim, twice on the same Transfer — a fixed round cap, not a judgment call made fresh each time. Deadlock hands the Transfer to the Escalation Protocol; it never resolves back to Concession/Firmness on its own.

**Errored**:
A Transfer's other terminal-until-overridden state, distinct from Deadlock — reached when the agent's own output fails schema validation twice in a row (one retry allowed) rather than the manager pushing back. Both Deadlock and Errored route to the same Regional Director Override; the distinction is *why* the agent stopped (human disagreement vs. the agent producing invalid output), which matters for reading the Agent Console but not for how it's resolved.

**Donor eligibility**:
A Site qualifies as a donor candidate for a given Transfer if `current_stock - requested_qty >= operating_threshold` for the relevant hardware type. Ranked by this filter plus proximity (Waypoint distance) — the same function serves both the initial donor search and every Concession Protocol re-run, across all Site Types. No `Site Type` is ever hard-excluded; `S`/`XL` sites simply rank low in practice because their `operating_threshold` leaves little surplus room.

**Manager Reply**:
Operator-supplied text (via preset or free-text input) that stands in for an email reply from a donor Site's manager persona. Both input paths are parsed by identical logic — there is no separate "scripted demo" code path.
_Avoid_: Simulated reply (implies the parsing is fake too — only the input source is staged, not the agent's handling of it)

**Agent Console**:
The dashboard's real-time log of the agent's actual reasoning, function calls, and drafted emails. Always genuine live LLM inference over current data, never scripted or pre-recorded — this is what distinguishes the demo from a canned walkthrough.

**Waypoint**:
An Eastern Singapore MRT station's real lat/long, used both as a Site's map coordinate and as the input to haversine distance calculations that drive donor ranking and courier ETA narration. One dataset backs both the visual and the logic — see [ADR-0003](docs/adr/0003-mrt-geography-backs-distance-calc.md).

## Related decisions

- [ADR-0001](docs/adr/0001-mocked-integrations-with-live-llm.md) — why Email/Calendar/Logistics/ZPL/ITSM are mocked in-process rather than real integrations
- [ADR-0002](docs/adr/0002-trigger-only-monitoring.md) — why there's no persistent background monitor process
- [ADR-0003](docs/adr/0003-mrt-geography-backs-distance-calc.md) — why MRT coordinates drive real distance logic, not just map pins
