-- Auto Negotiator schema (Neon Postgres, project `clickshop`)
-- Mirrors the domain model in /CONTEXT.md — see that file for term definitions.

CREATE TABLE IF NOT EXISTS sites (
  id                          TEXT PRIMARY KEY,
  name                        TEXT NOT NULL,
  site_type                   TEXT NOT NULL CHECK (site_type IN ('XL', 'L', 'M', 'S')),
  network_role                TEXT NOT NULL,           -- descriptive default only, never gates eligibility
  mrt_waypoint                TEXT NOT NULL,
  lat                         DOUBLE PRECISION NOT NULL,
  lng                         DOUBLE PRECISION NOT NULL,
  max_scanners                INT NOT NULL,
  max_printers                INT NOT NULL,
  operating_threshold_scanners INT NOT NULL,           -- static hard floor (PRD Section 3/4)
  operating_threshold_printers INT NOT NULL,
  current_scanners            INT NOT NULL,
  current_printers            INT NOT NULL
);

-- Seeded + ongoing daily depletion counts, used to compute the dynamic
-- min_buffer / critical_threshold (PRD Section 4). One row per site per
-- hardware type per day.
CREATE TABLE IF NOT EXISTS depletion_log (
  id            SERIAL PRIMARY KEY,
  site_id       TEXT NOT NULL REFERENCES sites(id),
  hardware_type TEXT NOT NULL CHECK (hardware_type IN ('scanner', 'printer')),
  day           DATE NOT NULL,
  depleted      INT NOT NULL,
  UNIQUE (site_id, hardware_type, day)
);

-- One row per shortage incident (CONTEXT.md: Transfer is the aggregate root,
-- not one donor attempt — donor_site_id is reassigned on concession, never
-- re-created as a new row).
CREATE TABLE IF NOT EXISTS transfers (
  id                SERIAL PRIMARY KEY,
  receiver_site_id  TEXT NOT NULL REFERENCES sites(id),
  donor_site_id     TEXT REFERENCES sites(id),
  hardware_type     TEXT NOT NULL CHECK (hardware_type IN ('scanner', 'printer')),
  quantity          INT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'sourcing'
                      CHECK (status IN (
                        'sourcing', 'awaiting_reply', 'locked',
                        'deadlock', 'errored', 'in_transit', 'completed'
                      )),
  declined_site_ids TEXT[] NOT NULL DEFAULT '{}',       -- excluded from re-ranking on concession
  pushback_count    INT NOT NULL DEFAULT 0,             -- Escalation Protocol round cap (Q10)
  escalation_sent   BOOLEAN NOT NULL DEFAULT FALSE,      -- has the deadlock summary email gone out yet?
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every email/Manager Reply across every attempted donor, appended to the
-- one Transfer it belongs to (CONTEXT.md: Transfer message history).
CREATE TABLE IF NOT EXISTS messages (
  id           SERIAL PRIMARY KEY,
  transfer_id  INT NOT NULL REFERENCES transfers(id),
  sender       TEXT NOT NULL CHECK (sender IN ('agent', 'manager', 'regional_director')),
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per agent turn (thought + single tool_call + its result) — the
-- literal source of the Agent Console's log lines (PRD Section 7/8).
CREATE TABLE IF NOT EXISTS agent_steps (
  id           SERIAL PRIMARY KEY,
  transfer_id  INT NOT NULL REFERENCES transfers(id),
  thought      TEXT NOT NULL,
  tool_name    TEXT NOT NULL,
  tool_args    JSONB NOT NULL,
  tool_result  JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One ITSM ticket per Transfer for its whole lifecycle (CONTEXT.md).
CREATE TABLE IF NOT EXISTS tickets (
  id           SERIAL PRIMARY KEY,
  transfer_id  INT NOT NULL UNIQUE REFERENCES transfers(id),
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at    TIMESTAMPTZ
);

-- Seeded promo/foot-traffic events, queried by the mocked Calendar API
-- (PRD Section 5) to verify or refute a manager's Concession Protocol claim.
CREATE TABLE IF NOT EXISTS calendar_events (
  id          SERIAL PRIMARY KEY,
  site_id     TEXT NOT NULL REFERENCES sites(id),
  event_date  DATE NOT NULL,
  description TEXT NOT NULL,
  peak_traffic BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_site ON calendar_events(site_id, event_date);
CREATE INDEX IF NOT EXISTS idx_depletion_log_site ON depletion_log(site_id, hardware_type);
CREATE INDEX IF NOT EXISTS idx_messages_transfer ON messages(transfer_id);
CREATE INDEX IF NOT EXISTS idx_agent_steps_transfer ON agent_steps(transfer_id);
