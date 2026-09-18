// In-memory login-attempt throttle (M7). This app runs as a single
// long-lived Node process (Docker container, not serverless), so a
// module-level Map persists correctly across requests — no external
// store needed for a group this size.
//
// Keyed by username rather than IP: the threat this specifically guards
// against is the fallback-auth password being a guessable last name (see
// docs/plan.md's "Known tradeoff"), i.e. someone hammering one account,
// not one IP hammering many accounts.

type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function isLockedOut(key: string): boolean {
  const bucket = attempts.get(key);
  if (!bucket) return false;
  if (bucket.resetAt < Date.now()) {
    attempts.delete(key);
    return false;
  }
  return bucket.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    bucket.count += 1;
  }
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
