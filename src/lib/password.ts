import { hash, verify } from "@node-rs/argon2";

// argon2id is @node-rs/argon2's own default algorithm — per docs/plan.md
// §2. The fallback-auth secret (last name) is low-entropy by design (plan
// §Confirmed decisions) — hash it properly anyway, there's no excuse to
// store plaintext.
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain);
  } catch {
    // Malformed/foreign hash — treat as a failed login, not a crash.
    return false;
  }
}
