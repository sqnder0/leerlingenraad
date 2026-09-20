import { describe, it, expect } from "vitest";
import { inviteLinkStatus, inviteLinkInvalidReason } from "./invite-links";

const now = new Date("2026-09-20T12:00:00Z");

function invite(overrides: Partial<Parameters<typeof inviteLinkStatus>[0]> = {}) {
  return {
    revokedAt: null,
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    ...overrides,
  };
}

describe("inviteLinkStatus", () => {
  it("is ACTIVE with no expiry, no cap, and no uses yet", () => {
    expect(inviteLinkStatus(invite(), now)).toBe("ACTIVE");
  });

  it("is REVOKED once revokedAt is set, even if otherwise still valid", () => {
    expect(inviteLinkStatus(invite({ revokedAt: now }), now)).toBe("REVOKED");
  });

  it("is EXPIRED once expiresAt is in the past", () => {
    expect(inviteLinkStatus(invite({ expiresAt: new Date("2026-09-19T00:00:00Z") }), now)).toBe(
      "EXPIRED",
    );
  });

  it("is ACTIVE while expiresAt is still in the future", () => {
    expect(inviteLinkStatus(invite({ expiresAt: new Date("2026-09-21T00:00:00Z") }), now)).toBe(
      "ACTIVE",
    );
  });

  it("is EXHAUSTED once usedCount reaches maxUses", () => {
    expect(inviteLinkStatus(invite({ maxUses: 3, usedCount: 3 }), now)).toBe("EXHAUSTED");
  });

  it("is ACTIVE while usedCount is below maxUses", () => {
    expect(inviteLinkStatus(invite({ maxUses: 3, usedCount: 2 }), now)).toBe("ACTIVE");
  });

  it("checks revoked before expired/exhausted", () => {
    expect(
      inviteLinkStatus(
        invite({ revokedAt: now, expiresAt: new Date("2020-01-01"), maxUses: 1, usedCount: 1 }),
        now,
      ),
    ).toBe("REVOKED");
  });
});

describe("inviteLinkInvalidReason", () => {
  it("returns a message for a missing invite", () => {
    expect(inviteLinkInvalidReason(null, now)).toBe("Deze uitnodigingslink bestaat niet.");
  });

  it("returns null for a usable invite", () => {
    expect(inviteLinkInvalidReason(invite(), now)).toBeNull();
  });

  it("returns a Dutch message for each non-active status", () => {
    expect(inviteLinkInvalidReason(invite({ revokedAt: now }), now)).toMatch(/ingetrokken/);
    expect(inviteLinkInvalidReason(invite({ expiresAt: new Date("2020-01-01") }), now)).toMatch(
      /verlopen/,
    );
    expect(inviteLinkInvalidReason(invite({ maxUses: 1, usedCount: 1 }), now)).toMatch(
      /volledig gebruikt/,
    );
  });
});
