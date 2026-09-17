import { addDays, startOfDay, isBefore } from "date-fns";
import { prisma } from "@/lib/prisma";

type Stats = Map<string, { count: number; lastAssignedAt: Date | null }>;

/** The duty rotation pool, per docs/plan.md: approved, non-teacher users. */
export async function getEligiblePool() {
  return prisma.user.findMany({
    where: { status: "APPROVED", isTeacher: false },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { username: "asc" }, // stable, deterministic base order
  });
}

/**
 * Each eligible member's autoAssigned GOING count within the trimester
 * (across every series, so fairness is holistic, not siloed per duty) plus
 * the date of their most recent one, for least-recently-assigned tie-breaks.
 */
async function getAssignmentStats(trimesterId: string): Promise<Stats> {
  const pool = await getEligiblePool();
  const stats: Stats = new Map(pool.map((u) => [u.id, { count: 0, lastAssignedAt: null }]));

  const signups = await prisma.signup.findMany({
    where: { autoAssigned: true, response: "GOING", event: { trimesterId } },
    select: { userId: true, event: { select: { startAt: true } } },
  });
  for (const s of signups) {
    const entry = stats.get(s.userId);
    if (!entry) continue; // no longer in the eligible pool
    entry.count += 1;
    if (!entry.lastAssignedAt || s.event.startAt > entry.lastAssignedAt) {
      entry.lastAssignedAt = s.event.startAt;
    }
  }
  return stats;
}

function pickLeastAssigned(stats: Stats, excludeIds: Set<string>, n: number): string[] {
  const candidates = [...stats.entries()]
    .filter(([id]) => !excludeIds.has(id))
    .sort((a, b) => {
      if (a[1].count !== b[1].count) return a[1].count - b[1].count;
      const at = a[1].lastAssignedAt?.getTime() ?? 0;
      const bt = b[1].lastAssignedAt?.getTime() ?? 0;
      return at - bt; // never assigned (0) sorts first
    });
  return candidates.slice(0, n).map(([id]) => id);
}

/** Every date in [trimesterStart, trimesterEnd] matching dayOfWeek. */
function occurrenceDates(trimesterStart: Date, trimesterEnd: Date, dayOfWeek: number): Date[] {
  const dates: Date[] = [];
  let d = startOfDay(trimesterStart);
  while (d.getDay() !== dayOfWeek) d = addDays(d, 1);
  while (!isBefore(trimesterEnd, d)) {
    dates.push(d);
    d = addDays(d, 7);
  }
  return dates;
}

function combineDateAndTime(date: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Generates this trimester's occurrences for a series and fairly assigns
 * each one, per docs/plan.md's duty-rotation algorithm. Idempotent: an
 * occurrence already generated for a given date is skipped, so re-running
 * after adding a series mid-trimester only fills in what's missing.
 */
export async function generateRosterForSeries(
  seriesId: string,
  trimesterId: string,
  createdById: string,
) {
  const [series, trimester] = await Promise.all([
    prisma.recurringSeries.findUniqueOrThrow({ where: { id: seriesId } }),
    prisma.trimester.findUniqueOrThrow({ where: { id: trimesterId } }),
  ]);

  const dates = occurrenceDates(trimester.startsAt, trimester.endsAt, series.dayOfWeek);
  const stats = await getAssignmentStats(trimesterId);

  let occurrencesCreated = 0;
  for (const date of dates) {
    const startAt = combineDateAndTime(date, series.startTime);

    const existing = await prisma.event.findFirst({
      where: { seriesId, trimesterId, startAt },
      select: { id: true },
    });
    if (existing) continue;

    const endAt = combineDateAndTime(date, series.endTime);
    const event = await prisma.event.create({
      data: {
        title: series.title,
        description: series.description,
        location: series.location,
        startAt,
        endAt,
        pointValue: series.pointValue,
        status: "PUBLISHED",
        schoolYearId: series.schoolYearId,
        seriesId,
        trimesterId,
        createdById,
      },
    });

    const picked = pickLeastAssigned(stats, new Set(), series.membersNeeded);
    for (const userId of picked) {
      await prisma.signup.create({
        data: { eventId: event.id, userId, response: "GOING", autoAssigned: true },
      });
      const entry = stats.get(userId);
      if (entry) {
        entry.count += 1;
        entry.lastAssignedAt = startAt;
      }
    }
    occurrencesCreated++;
  }

  return { occurrencesCreated, totalOccurrences: dates.length };
}

/**
 * Finds a replacement for one vacated slot (a member declined an
 * autoAssigned signup), picking whoever in the pool currently has the
 * fewest assigned slots this trimester. Returns the replacement's user id,
 * or null if no eligible replacement exists (slot stays open).
 */
export async function reassignSlot(eventId: string, declinedUserId: string) {
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { signups: { where: { response: "GOING" } } },
  });
  if (!event.trimesterId) return null; // not a rotation event

  const stats = await getAssignmentStats(event.trimesterId);
  const exclude = new Set([declinedUserId, ...event.signups.map((s) => s.userId)]);
  const [replacementId] = pickLeastAssigned(stats, exclude, 1);
  if (!replacementId) return null;

  await prisma.signup.create({
    data: { eventId, userId: replacementId, response: "GOING", autoAssigned: true },
  });
  return replacementId;
}
