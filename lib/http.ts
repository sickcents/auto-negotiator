import type { VercelRequest, VercelResponse } from "@vercel/node";

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

// Catches rejections from handlers so a transient failure (e.g. a Neon
// connection timeout) returns a 500 instead of crashing the whole
// `vercel dev` / function process.
export function withErrorHandling(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
    }
  };
}
