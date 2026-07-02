# Gemini instead of Groq/Llama as the default LLM Engine

**Status:** accepted (supersedes the "Groq by default" framing in PRD Section 2)

Section 2 originally defaulted to Groq (Llama 3.3 70B Versatile) for cost and LPU inference speed, with OpenAI/Gemini named as valid fidelity swap-ins. The user already had a Gemini API key and no Groq account, so we swapped the default rather than creating a new account for a portfolio demo. This was a safe swap specifically because ADR-0005's enforced `{"thought", "action"}` envelope already made the Agent Console's behavior independent of any provider's native reasoning output — nothing about the console, the retry logic, or the tool-calling prompt needed to change.

`lib/domain/llm.ts` now uses the `openai` package (a generic client for the OpenAI-shaped chat-completions request/response format) pointed at Gemini's own OpenAI-compatible endpoint (`generativelanguage.googleapis.com/v1beta/openai/`), authenticated with `GEMINI_API_KEY`. No request goes to `api.openai.com` — this is the same trick `groq-sdk` used (an OpenAI-SDK fork pointed at Groq's servers), just done with the unforked package since no Gemini-branded fork exists. Default model is `gemini-3.5-flash`.

**Considered:** Google's native `@google/generative-ai` SDK. Rejected for now — it has a different request/response shape than the enforced envelope's JSON-mode parsing was written against, requiring more code changes for no behavioral benefit over the OpenAI-compatible endpoint.
