// Deterministic PRNG so the seeded 7-day depletion history (PRD Section 4
// "Seed history", design-session Q20) is identical on every reset — the
// same demo walkthrough is reproducible for repeated interviews/recordings.

function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// mulberry32
export function createSeededRng(seedString: string): () => number {
  let state = hashStringToSeed(seedString);
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Inclusive random int in [min, max] using the given PRNG.
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
