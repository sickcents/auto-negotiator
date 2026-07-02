# Mocked integrations, human-in-the-loop reply injection, live LLM calls

**Status:** accepted

The Email/Calendar/Logistics/ZPL/ITSM "APIs" (PRD Section 5) are entirely in-process mocks — no real Gmail/Calendar OAuth, no real courier or hardware endpoint. This was a real trade-off: real Gmail integration would make the demo *look* more convincing (an actual email lands in an inbox) but requires OAuth token management and secret storage in a public GitHub repo deployed to Vercel, for zero gain in what a reviewer actually learns about the agent's reasoning.

To avoid the mocks reading as "faked," the LLM calls themselves are never scripted — every reasoning step, function call, and drafted email in the Agent Console is genuine live inference over the current DB state. The only staged element is the *other side* of the conversation: since there's no real store manager, the operator role-plays that part through a dashboard control (presets or free text, PRD Section 7) that feeds the agent's parsing logic exactly as a real email reply would. Both input paths go through one identical code path — no special-cased "demo mode" branch — which is what lets someone type an adversarial reply live and prove the Concession/Firmness/Escalation logic actually works, rather than trusting a canned walkthrough.

**Considered:** real Gmail send/receive via OAuth, mocking only the physical/hardware side. Rejected — the OAuth/secrets surface area in a public repo isn't worth it for a portfolio piece where the reviewer can't independently verify email delivery anyway.
