// Pure invite-link decisions, kept separate from the Server Actions/pages
// that call them so they're unit-testable without a database — mirrors
// gating.ts's split between pure logic and actual redirect()/prisma calls.

export type InviteLinkSubject = {
  revokedAt: Date | null;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
};

export type InviteLinkStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "EXHAUSTED";

export function inviteLinkStatus(
  invite: InviteLinkSubject,
  now: Date = new Date(),
): InviteLinkStatus {
  if (invite.revokedAt) return "REVOKED";
  if (invite.expiresAt && invite.expiresAt < now) return "EXPIRED";
  if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) return "EXHAUSTED";
  return "ACTIVE";
}

const INVALID_MESSAGES: Record<Exclude<InviteLinkStatus, "ACTIVE">, string> = {
  REVOKED: "Deze uitnodigingslink is ingetrokken.",
  EXPIRED: "Deze uitnodigingslink is verlopen.",
  EXHAUSTED: "Deze uitnodigingslink is al volledig gebruikt.",
};

/** Null when the invite (still) works; otherwise the Dutch message to show the visitor. */
export function inviteLinkInvalidReason(
  invite: InviteLinkSubject | null,
  now: Date = new Date(),
): string | null {
  if (!invite) return "Deze uitnodigingslink bestaat niet.";
  const status = inviteLinkStatus(invite, now);
  return status === "ACTIVE" ? null : INVALID_MESSAGES[status];
}
