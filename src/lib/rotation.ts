import { addDays, addWeeks, startOfDay, isBefore } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getProjectedBalances } from "@/lib/data/points";

type Stats = Map<string, { balance: number; lastAssignedAt: Date | null }>;

/** The duty rotation pool, per docs/plan.md: approved, non-teacher users. */
export async function getEligiblePool() {
  return prisma.user.findMany({
    where: { status: "APPROVED", isTeacher: false },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { username: "asc" }, // stable, deterministic base order
  });
}

/**
 * Each eligible member's projected points balance this school year
 * (current balance plus already-scheduled-but-not-yet-awarded points —
 * see getProjectedBalances) plus the date of their most recent auto
 * assignment, for tie-breaks. Scoped to the whole school year (not a
 * trimester) so fairness converges across the full year, matching how
 * points themselves are school-year scoped.
 */
async function getAssignmentStats(schoolYearId: string): Promise<Stats> {
  const pool = await getEligiblePool();
  const ids = pool.map((u) => u.id);
  const balances = await getProjectedBalances(schoolYearId, ids);

  const stats: Stats = new Map(
    pool.map((u) => [u.id, { balance: balances.get(u.id) ?? 0, lastAssignedAt: null }]),
  );

  const signups = await prisma.signup.findMany({
    where: { autoAssigned: true, response: "GOING", event: { schoolYearId } },
    select: { userId: true, event: { select: { startAt: true } } },
  });
  for (const s of signups) {
    const entry = stats.get(s.userId);
    if (!entry) continue; // no longer in the eligible pool
    if (!entry.lastAssignedAt || s.event.startAt > entry.lastAssignedAt) {
      entry.lastAssignedAt = s.event.startAt;
    }
  }
  return stats;
}

/** Ascending by projected balance (lowest = picked first), then by longest-idle. */
export function pickLowestProjectedBalance(
  stats: Stats,
  excludeIds: Set<string>,
  n: number,
): string[] {
  const candidates = [...stats.entries()]
    .filter(([id]) => !excludeIds.has(id))
    .sort((a, b) => {
      if (a[1].balance !== b[1].balance) return a[1].balance - b[1].balance;
      const at = a[1].lastAssignedAt?.getTime() ?? 0;
      const bt = b[1].lastAssignedAt?.getTime() ?? 0;
      return at - bt; // never assigned (0) sorts first
    });
  return candidates.slice(0, n).map(([id]) => id);
}

/** Every date matching dayOfWeek in [from, to], inclusive. */
export function occurrenceDatesInRange(from: Date, to: Date, dayOfWeek: number): Date[] {
  const dates: Date[] = [];
  let d = startOfDay(from);
  while (d.getDay() !== dayOfWeek) d = addDays(d, 1);
  while (!isBefore(to, d)) {
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
 * Which user ids get auto-assigned to a newly-created occurrence, per the
 * series' AssignmentMode:
 * - ROTATION: `membersNeeded` people, lowest projected points balance
 *   first. `previousPicks` (whoever filled this series' immediately
 *   preceding occurrence) is excluded so the same person can't be handed
 *   two occurrences in a row back to back ("don't spam a person in") —
 *   unless the eligible pool is too small to fill the slots without them,
 *   in which case the exclusion is dropped rather than leaving a slot
 *   empty.
 * - EVERYONE: every approved member (teachers included — this isn't a duty
 *   burden to distribute fairly, it's "the whole group is invited").
 * - SPECIFIC: the series' fixed invite list, exactly as configured.
 */
async function pickAttendees(
  series: { id: string; assignmentMode: string; membersNeeded: number },
  stats: Stats,
  previousPicks: Set<string>,
): Promise<string[]> {
  switch (series.assignmentMode) {
    case "EVERYONE": {
      const members = await prisma.user.findMany({
        where: { status: "APPROVED" },
        select: { id: true },
      });
      return members.map((m) => m.id);
    }
    case "SPECIFIC": {
      const invites = await prisma.recurringSeriesInvite.findMany({
        where: { seriesId: series.id },
        select: { userId: true },
      });
      return invites.map((i) => i.userId);
    }
    case "ROTATION":
    default: {
      const withoutRepeat = pickLowestProjectedBalance(stats, previousPicks, series.membersNeeded);
      if (withoutRepeat.length >= series.membersNeeded) return withoutRepeat;
      // Pool too small to skip last time's picks and still fill the slots.
      return pickLowestProjectedBalance(stats, new Set(), series.membersNeeded);
    }
  }
}

/**
 * Keeps a series' occurrences generated `series.weeksAhead` weeks into the
 * future, picking up wherever it last left off (idempotent — an occurrence
 * already generated for a given date is never touched again). This
 * replaces the old generate-a-whole-trimester-at-once flow: call it
 * whenever the rolling window should be topped up — the periodic job in
 * instrumentation.ts, or right after a series is created/edited.
 */
export async function extendSeriesRoster(seriesId: string) {
  const series = await prisma.recurringSeries.findUniqueOrThrow({ where: { id: seriesId } });
  if (!series.isActive) return { occurrencesCreated: 0 };

  const now = new Date();
  const horizon = addWeeks(now, series.weeksAhead);

  const latestExisting = await prisma.event.findFirst({
    where: { seriesId },
    orderBy: { startAt: "desc" },
    select: { id: true, startAt: true },
  });

  const dates = occurrenceDatesInRange(
    latestExisting ? addDays(latestExisting.startAt, 1) : now,
    horizon,
    series.dayOfWeek,
  );
  if (dates.length === 0) return { occurrencesCreated: 0 };

  const stats =
    series.assignmentMode === "ROTATION" ? await getAssignmentStats(series.schoolYearId) : null;

  let previousPicks = new Set<string>();
  if (series.assignmentMode === "ROTATION" && latestExisting) {
    const prevSignups = await prisma.signup.findMany({
      where: { eventId: latestExisting.id, autoAssigned: true, response: "GOING" },
      select: { userId: true },
    });
    previousPicks = new Set(prevSignups.map((s) => s.userId));
  }

  let occurrencesCreated = 0;
  for (const date of dates) {
    const startAt = combineDateAndTime(date, series.startTime);
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
        createdById: series.createdById,
      },
    });

    const picked = await pickAttendees(series, stats ?? new Map(), previousPicks);
    for (const userId of picked) {
      await prisma.signup.create({
        data: { eventId: event.id, userId, response: "GOING", autoAssigned: true },
      });
      const entry = stats?.get(userId);
      if (entry) {
        entry.balance += series.pointValue;
        entry.lastAssignedAt = startAt;
      }
    }
    if (series.assignmentMode === "ROTATION") previousPicks = new Set(picked);
    occurrencesCreated++;
  }

  return { occurrencesCreated, totalOccurrences: dates.length };
}

/** Tops up every active series' rolling window for the active school year. */
export async function extendAllActiveSeriesRosters() {
  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return;

  const series = await prisma.recurringSeries.findMany({
    where: { schoolYearId: activeYear.id, isActive: true },
    select: { id: true },
  });
  for (const s of series) {
    await extendSeriesRoster(s.id);
  }
}

/**
 * Finds a replacement for one vacated slot (a member declined an
 * autoAssigned signup), picking whoever in the pool currently has the
 * lowest projected points balance. Only applies to ROTATION series —
 * EVERYONE/SPECIFIC have no "backfill" concept, declining just leaves that
 * one person off, so this returns null immediately for those.
 */
export async function reassignSlot(eventId: string, declinedUserId: string) {
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { signups: { where: { response: "GOING" } }, series: true },
  });
  if (!event.series || event.series.assignmentMode !== "ROTATION") return null;

  const stats = await getAssignmentStats(event.schoolYearId);
  const exclude = new Set([declinedUserId, ...event.signups.map((s) => s.userId)]);
  const [replacementId] = pickLowestProjectedBalance(stats, exclude, 1);
  if (!replacementId) return null;

  await prisma.signup.create({
    data: { eventId, userId: replacementId, response: "GOING", autoAssigned: true },
  });
  return replacementId;
}
