import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getProjectedBalances } from "@/lib/data/points";
import { occurrenceDatesInRange, pickLowestProjectedBalance, extendSeriesRoster } from "./rotation";

describe("occurrenceDatesInRange (pure)", () => {
  it("returns every matching weekday within the range, inclusive", () => {
    // 2026-09-02 is a Wednesday.
    const from = new Date("2026-09-02T08:00:00");
    const to = new Date("2026-09-23T08:00:00");
    const dates = occurrenceDatesInRange(from, to, 3 /* woensdag */);

    expect(dates).toHaveLength(4);
    expect(dates.every((d) => d.getDay() === 3)).toBe(true);
  });

  it("walks forward to the first matching weekday when `from` doesn't match", () => {
    // 2026-09-02 is a Wednesday; asking for Friday (5) should start on 09-04.
    const from = new Date("2026-09-02T08:00:00");
    const to = new Date("2026-09-04T23:59:59");
    const dates = occurrenceDatesInRange(from, to, 5 /* vrijdag */);

    expect(dates).toHaveLength(1);
    expect(dates[0].getDate()).toBe(4);
  });

  it("returns nothing when the range is entirely before the first match", () => {
    const from = new Date("2026-09-02T08:00:00");
    const to = new Date("2026-09-01T08:00:00");
    expect(occurrenceDatesInRange(from, to, 3)).toHaveLength(0);
  });
});

describe("pickLowestProjectedBalance (pure)", () => {
  function stats(entries: [string, number, Date | null][]) {
    return new Map(
      entries.map(([id, balance, lastAssignedAt]) => [id, { balance, lastAssignedAt }]),
    );
  }

  it("picks the lowest balance first", () => {
    const s = stats([
      ["a", 5, null],
      ["b", -3, null],
      ["c", 0, null],
    ]);
    expect(pickLowestProjectedBalance(s, new Set(), 1)).toEqual(["b"]);
    expect(pickLowestProjectedBalance(s, new Set(), 2)).toEqual(["b", "c"]);
  });

  it("ties break on the longest-idle (never-assigned sorts first)", () => {
    const s = stats([
      ["a", 0, new Date("2026-01-10")],
      ["b", 0, null],
      ["c", 0, new Date("2026-01-01")],
    ]);
    expect(pickLowestProjectedBalance(s, new Set(), 3)).toEqual(["b", "c", "a"]);
  });

  it("excludes the given ids from consideration", () => {
    const s = stats([
      ["a", -10, null],
      ["b", 0, null],
    ]);
    expect(pickLowestProjectedBalance(s, new Set(["a"]), 1)).toEqual(["b"]);
  });

  it("returns fewer than n when the pool minus exclusions is too small", () => {
    const s = stats([["a", 0, null]]);
    expect(pickLowestProjectedBalance(s, new Set(["a"]), 1)).toHaveLength(0);
  });
});

// Integration test against the real (local dev) Postgres, matching the
// fixture/teardown style already used by points.test.ts.
describe("extendSeriesRoster (integration)", () => {
  let schoolYearId: string;
  let adminId: string;
  let lowId: string; // starts far below everyone — should be picked first
  let midId: string;
  let highId: string;
  let seriesId: string;
  const pointValue = 1;

  beforeAll(async () => {
    const schoolYear = await prisma.schoolYear.findFirstOrThrow({ where: { isActive: true } });
    schoolYearId = schoolYear.id;
    const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
    adminId = admin.id;

    const suffix = Date.now();
    const [low, mid, high] = await Promise.all([
      prisma.user.create({
        data: {
          firstName: "Low",
          lastName: `Vitest-${suffix}`,
          username: `vitest-low-${suffix}`,
          role: "MEMBER",
          status: "APPROVED",
        },
      }),
      prisma.user.create({
        data: {
          firstName: "Mid",
          lastName: `Vitest-${suffix}`,
          username: `vitest-mid-${suffix}`,
          role: "MEMBER",
          status: "APPROVED",
        },
      }),
      prisma.user.create({
        data: {
          firstName: "High",
          lastName: `Vitest-${suffix}`,
          username: `vitest-high-${suffix}`,
          role: "MEMBER",
          status: "APPROVED",
        },
      }),
    ]);
    lowId = low.id;
    midId = mid.id;
    highId = high.id;

    // The rotation pool is global (every approved, non-teacher user), not
    // scoped to this test's fixtures — so to make the ordering
    // deterministic regardless of whatever other members/balances already
    // exist in the dev DB, anchor the three fixture balances comfortably
    // below the lowest balance anyone else currently has.
    const otherPool = await prisma.user.findMany({
      where: { status: "APPROVED", isTeacher: false },
      select: { id: true },
    });
    const otherBalances = await getProjectedBalances(
      schoolYearId,
      otherPool.map((u) => u.id),
    );
    const floor = Math.min(0, ...otherBalances.values()) - 1000;

    // lowId starts so far below the floor that even after being picked
    // once (+1 point) it's still the lowest by balance alone — isolates
    // the "exclude the immediately preceding occurrence's picks"
    // anti-spam rule from the points-convergence effect, since without
    // that rule lowId would win every single occurrence.
    await prisma.pointsLedger.createMany({
      data: [
        {
          userId: lowId,
          delta: floor,
          reason: "fixture",
          type: "MANUAL_ADJUSTMENT",
          schoolYearId,
          createdById: adminId,
        },
        {
          userId: midId,
          delta: floor + 50,
          reason: "fixture",
          type: "MANUAL_ADJUSTMENT",
          schoolYearId,
          createdById: adminId,
        },
        {
          userId: highId,
          delta: floor + 100,
          reason: "fixture",
          type: "MANUAL_ADJUSTMENT",
          schoolYearId,
          createdById: adminId,
        },
      ],
    });

    const series = await prisma.recurringSeries.create({
      data: {
        title: `Vitest rotation series ${suffix}`,
        dayOfWeek: new Date().getDay(),
        startTime: "10:00",
        endTime: "11:00",
        pointValue,
        membersNeeded: 1,
        weeksAhead: 3,
        assignmentMode: "ROTATION",
        schoolYearId,
        createdById: adminId,
      },
    });
    seriesId = series.id;
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { seriesId } }); // cascades signups
    await prisma.recurringSeries.delete({ where: { id: seriesId } });
    await prisma.pointsLedger.deleteMany({ where: { userId: { in: [lowId, midId, highId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [lowId, midId, highId] } } });
  });

  it("picks the lowest-balance member first, then never repeats the immediately preceding pick", async () => {
    const result = await extendSeriesRoster(seriesId);
    expect(result.occurrencesCreated).toBeGreaterThanOrEqual(3);

    const events = await prisma.event.findMany({
      where: { seriesId },
      orderBy: { startAt: "asc" },
      include: { signups: { where: { autoAssigned: true, response: "GOING" } } },
    });
    expect(events.length).toBe(result.occurrencesCreated);

    const picks = events.map((e) => e.signups[0]?.userId);
    expect(picks[0]).toBe(lowId); // far lowest, picked first
    expect(picks[1]).not.toBe(picks[0]); // never the same as the immediately preceding pick
    expect(picks[1]).toBe(midId); // next-lowest among the remaining two
    if (picks.length > 2) {
      expect(picks[2]).not.toBe(picks[1]);
    }
  });

  it("is idempotent: re-running after the window is already filled creates nothing new", async () => {
    const before = await prisma.event.count({ where: { seriesId } });
    const result = await extendSeriesRoster(seriesId);
    const after = await prisma.event.count({ where: { seriesId } });

    expect(result.occurrencesCreated).toBe(0);
    expect(after).toBe(before);
  });
});
