# Enforced thought/tool-call envelope instead of relying on native provider reasoning

**Status:** accepted

The Agent Console (PRD Section 7) needs to show the agent's internal reasoning, not just its actions — but Section 2's LLM Engine is deliberately swappable (Groq/Llama by default for cost and speed, OpenAI/Gemini as fidelity swap-ins), and native "thinking"/reasoning exposure differs across providers and even across model tiers within the same provider. If the console's core feature depended on a specific provider's reasoning output, swapping engines would silently change what the demo shows.

Every model turn is instead required (via prompt + expected structured output) to return `{"thought": "<one sentence>", "tool_call": {...}}` — or a final answer in place of a tool call. This is ordinary structured output any tool-calling-capable model can produce, not a provider-specific feature, so the console's behavior stays identical whether the configured engine is Groq's cheap/fast Llama 3.3 70B or a pricier OpenAI/Gemini model.

**Considered:** relying on each provider's native reasoning/thinking mode where available. Rejected — it would make a demo-critical feature's fidelity depend on which LLM Engine happens to be configured, undermining the point of Section 2 treating the engine as swappable.
