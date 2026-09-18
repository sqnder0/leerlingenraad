import type { Role, UserStatus } from "@/generated/prisma/enums";

// Pure gating decisions, kept separate from current-user.ts's actual
// redirect() calls so they're unit-testable without mocking Next's
// request-context internals (next/navigation, next/headers). Mirrors the
// two-layer gating in docs/plan.md §2.

type GateSubject = { status: UserStatus; role: Role } | null;

/** Where an unapproved/unauthenticated visitor should be sent, or null if allowed through. */
export function resolveApprovedUserGate(
  user: GateSubject,
): "/login" | "/pending" | "/rejected" | null {
  if (!user) return "/login";
  if (user.status === "PENDING") return "/pending";
  if (user.status === "REJECTED") return "/rejected";
  return null;
}

/** Same as above, plus: a non-admin gets sent to the dashboard instead of the admin area. */
export function resolveAdminGate(
  user: GateSubject,
): "/login" | "/pending" | "/rejected" | "/dashboard" | null {
  const approvedGate = resolveApprovedUserGate(user);
  if (approvedGate) return approvedGate;
  if (user!.role !== "ADMIN") return "/dashboard";
  return null;
}
