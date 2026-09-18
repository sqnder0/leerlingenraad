import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { confirmAttendance, getBalance } from "./points";

// Integration test against the real (local dev) Postgres — matches how
// this project has been verified throughout: fixtures are created fresh
// and torn down here rather than depending on seed data, so this test is
// self-contained and repeatable regardless of what's been seeded.
describe("confirmAttendance idempotency (plan §1: can't double-award)", () => {
  let schoolYearId: string;
  let adminId: string;
  let memberId: string;
  let eventId: string;
  let signupId: string;
  const pointValue = 4;

  beforeAll(async () => {
    const schoolYear = await prisma.schoolYear.findFirstOrThrow({ where: { isActive: true } });
    schoolYearId = schoolYear.id;

    const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
    adminId = admin.id;

    const member = await prisma.user.create({
      data: {
        firstName: "Test",
        lastName: `Vitest-${Date.now()}`,
        username: `vitest-${Date.now()}`,
        role: "MEMBER",
        status: "APPROVED",
      },
    });
    memberId = member.id;

    const event = await prisma.event.create({
      data: {
        title: "Vitest fixture event",
        startAt: new Date(),
        endAt: new Date(),
        pointValue,
        status: "PUBLISHED",
        schoolYearId,
        createdById: adminId,
      },
    });
    eventId = event.id;

    const signup = await prisma.signup.create({
      data: { eventId, userId: memberId, response: "GOING" },
    });
    signupId = signup.id;
  });

  afterAll(async () => {
    await prisma.event.delete({ where: { id: eventId } }); // cascades the signup
    await prisma.user.delete({ where: { id: memberId } }); // cascades any ledger entries
  });

  it("awards points once, and re-running the exact same confirmation doesn't double-award", async () => {
    expect(await getBalance(memberId, schoolYearId)).toBe(0);

    await confirmAttendance(eventId, [{ signupId, attended: "PRESENT" }], adminId);
    expect(await getBalance(memberId, schoolYearId)).toBe(pointValue);

    await confirmAttendance(eventId, [{ signupId, attended: "PRESENT" }], adminId);
    expect(await getBalance(memberId, schoolYearId)).toBe(pointValue); // unchanged

    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    expect(event.status).toBe("COMPLETED");
  });
});
