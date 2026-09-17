import { prisma } from "@/lib/prisma";

// The ONLY module allowed to query PointsLedger, per docs/plan.md §3.
// Imported only from app/(protected)/admin/** and actions/admin/** — see
// eslint.config.mjs for the enforced no-restricted-imports rule.

export async function getBalance(userId: string, schoolYearId: string): Promise<number> {
  const result = await prisma.pointsLedger.aggregate({
    where: { userId, schoolYearId },
    _sum: { delta: true },
  });
  return result._sum.delta ?? 0;
}

/** Fairness dashboard data: one row per approved, non-teacher member. */
export async function getBalances(schoolYearId: string, classGroup?: string) {
  const members = await prisma.user.findMany({
    where: { status: "APPROVED", isTeacher: false, ...(classGroup ? { classGroup } : {}) },
    select: { id: true, firstName: true, lastName: true, classGroup: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const sums = await prisma.pointsLedger.groupBy({
    by: ["userId"],
    where: { schoolYearId, userId: { in: members.map((m) => m.id) } },
    _sum: { delta: true },
  });
  const balanceByUser = new Map(sums.map((s) => [s.userId, s._sum.delta ?? 0]));

  return members.map((m) => ({ ...m, balance: balanceByUser.get(m.id) ?? 0 }));
}

export async function getLedgerEntries(userId: string, schoolYearId: string) {
  return prisma.pointsLedger.findMany({
    where: { userId, schoolYearId },
    include: {
      event: { select: { title: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

type AttendanceInput = { signupId: string; attended: "PRESENT" | "ABSENT" };

/**
 * Confirms attendance for an event: marks each signup PRESENT/ABSENT and
 * awards points for PRESENT ones, then marks the event COMPLETED.
 * Idempotent — a signup already pointsAwarded is left untouched even if
 * marked PRESENT again, so re-running this can't double-award (plan §1).
 */
export async function confirmAttendance(
  eventId: string,
  attendance: AttendanceInput[],
  adminId: string,
) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  await prisma.$transaction(async (tx) => {
    for (const { signupId, attended } of attendance) {
      const signup = await tx.signup.findUniqueOrThrow({ where: { id: signupId } });
      if (signup.eventId !== eventId) continue; // guards against a mismatched form post

      await tx.signup.update({ where: { id: signupId }, data: { attended } });

      if (attended === "PRESENT" && !signup.pointsAwarded) {
        await tx.pointsLedger.create({
          data: {
            userId: signup.userId,
            delta: event.pointValue,
            reason: `Aanwezig op "${event.title}"`,
            type: "EVENT_ATTENDANCE",
            eventId,
            signupId,
            schoolYearId: event.schoolYearId,
            createdById: adminId,
          },
        });
        await tx.signup.update({ where: { id: signupId }, data: { pointsAwarded: true } });
      }
    }

    await tx.event.update({ where: { id: eventId }, data: { status: "COMPLETED" } });
  });
}

export async function addManualAdjustment(
  userId: string,
  delta: number,
  reason: string,
  schoolYearId: string,
  adminId: string,
) {
  return prisma.pointsLedger.create({
    data: { userId, delta, reason, type: "MANUAL_ADJUSTMENT", schoolYearId, createdById: adminId },
  });
}
