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

/**
 * Current balance plus the point value of each user's own already-scheduled
 * but not-yet-awarded GOING signups (future events, points not yet given
 * out via confirmAttendance). Used by the duty-rotation picker so it favors
 * whoever will end up lowest, not just whoever already is — the whole
 * point of "accounting for points you'll gain" is to keep the picker from
 * repeatedly stacking one person once they're due for something else.
 */
export async function getProjectedBalances(
  schoolYearId: string,
  userIds: string[],
): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  const [ledgerSums, futureSignups] = await Promise.all([
    prisma.pointsLedger.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, schoolYearId },
      _sum: { delta: true },
    }),
    prisma.signup.findMany({
      where: {
        userId: { in: userIds },
        response: "GOING",
        pointsAwarded: false,
        event: { schoolYearId, startAt: { gt: new Date() } },
      },
      select: { userId: true, event: { select: { pointValue: true } } },
    }),
  ]);

  const balances = new Map(userIds.map((id) => [id, 0]));
  for (const row of ledgerSums) balances.set(row.userId, row._sum.delta ?? 0);
  for (const s of futureSignups) {
    balances.set(s.userId, (balances.get(s.userId) ?? 0) + s.event.pointValue);
  }
  return balances;
}

/**
 * A member's own current balance alongside the average across the same
 * rotation-eligible pool (approved, non-teacher) — shown on the member
 * dashboard so people can see how much they should still contribute to
 * end the school year level with everyone else (plan §3 exception: this
 * is aggregate/self-only, never another member's individual balance).
 */
export async function getFairnessSummary(
  userId: string,
  schoolYearId: string,
): Promise<{ myBalance: number; average: number }> {
  const pool = await prisma.user.findMany({
    where: { status: "APPROVED", isTeacher: false },
    select: { id: true },
  });
  const ids = pool.map((u) => u.id);

  const [myBalance, sums] = await Promise.all([
    getBalance(userId, schoolYearId),
    prisma.pointsLedger.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, schoolYearId },
      _sum: { delta: true },
    }),
  ]);
  const total = sums.reduce((sum, row) => sum + (row._sum.delta ?? 0), 0);

  return { myBalance, average: ids.length > 0 ? total / ids.length : 0 };
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
