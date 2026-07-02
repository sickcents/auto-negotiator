# Node.js/TypeScript backend instead of Python/Flask

**Status:** accepted (supersedes the "Python/Flask" framing in earlier PRD drafts and ADR-0002)

The original PRD chose Python/Flask, justified by wanting quality LLM outputs "rather than self-hosted Hugging Face models" — an argument against an architecture (self-hosted models) that was never actually adopted. Once every other stack decision landed (no background thread, no ML libraries, static frontend instead of server-rendered templates, LLM/DB access both just HTTP/driver calls available equally in any language), nothing remaining actually required Python. Confirmed with the user that a Python backend isn't a deliberate portfolio signal here — it was carried over from the initial draft, not load-bearing.

Given the final shape (static frontend + stateless `/api/*` JSON endpoints on Vercel), Node.js/TypeScript is the more idiomatic choice: it's Vercel's first-class serverless runtime (no separate Python builder, `requirements.txt`, or `vercel.json` Python-specific config), and every dependency this project needs (LLM provider SDKs, the Neon Postgres driver) is equally well supported in JS/TS.

**Considered:** keeping Python/Flask anyway. Rejected — it would only add Vercel packaging friction with no corresponding benefit, since the "why Python" justification no longer applied to the architecture actually being built.
