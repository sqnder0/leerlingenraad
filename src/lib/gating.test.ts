import { describe, it, expect } from "vitest";
import { resolveApprovedUserGate, resolveAdminGate } from "./gating";

describe("resolveApprovedUserGate", () => {
  it("sends an unauthenticated visitor to /login", () => {
    expect(resolveApprovedUserGate(null)).toBe("/login");
  });

  it("sends a PENDING user to /pending", () => {
    expect(resolveApprovedUserGate({ status: "PENDING", role: "MEMBER" })).toBe("/pending");
  });

  it("sends a REJECTED user to /rejected", () => {
    expect(resolveApprovedUserGate({ status: "REJECTED", role: "MEMBER" })).toBe("/rejected");
  });

  it("lets an APPROVED member through", () => {
    expect(resolveApprovedUserGate({ status: "APPROVED", role: "MEMBER" })).toBeNull();
  });

  it("lets an APPROVED admin through", () => {
    expect(resolveApprovedUserGate({ status: "APPROVED", role: "ADMIN" })).toBeNull();
  });
});

describe("resolveAdminGate", () => {
  it("sends an unauthenticated visitor to /login (not /dashboard)", () => {
    expect(resolveAdminGate(null)).toBe("/login");
  });

  it("sends a PENDING user to /pending before checking role", () => {
    expect(resolveAdminGate({ status: "PENDING", role: "ADMIN" })).toBe("/pending");
  });

  it("sends an APPROVED non-admin member to /dashboard", () => {
    expect(resolveAdminGate({ status: "APPROVED", role: "MEMBER" })).toBe("/dashboard");
  });

  it("lets an APPROVED admin through", () => {
    expect(resolveAdminGate({ status: "APPROVED", role: "ADMIN" })).toBeNull();
  });
});
