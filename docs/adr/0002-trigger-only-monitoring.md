# Inline trigger check instead of a persistent monitor process

**Status:** accepted

PRD Section 4 originally described "a Flask background task" continuously polling inventory — a long-running, always-on process. That's incompatible with Vercel's stateless, short-lived serverless functions, and there's a deployment target already committed to (Vercel + GitHub, for portfolio visibility).

Since the only thing that ever changes inventory in this demo is an operator action (the "Simulate Incident" control — there's no real hardware phoning in usage data), a background poller would have nothing to discover between actions that the action's own handler doesn't already know. The threshold check (`current_stock < min_buffer` or `depletion_rate > critical_threshold`) is instead a plain function called synchronously at the point of mutation. The Agent Console still narrates it as "checking thresholds..." to preserve the monitoring framing for anyone watching the demo.

**Considered:** a Vercel Cron Job polling on an interval (closer to the original "continuous monitor" framing); splitting hosting so a real Flask background thread runs on a platform that supports it (Render/Railway/Fly.io) while Vercel serves the frontend. Rejected both — they add infrastructure with no behavioral difference the demo can actually show, since nothing changes inventory except the operator.
