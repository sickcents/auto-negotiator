import { neon } from "@neondatabase/serverless";

// SQL-over-HTTP client (no connection pool to manage) — the right fit for
// stateless Vercel functions (ADR-0002, PRD Section 2 "Database").
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const sql = neon(requireEnv("DATABASE_URL"));
