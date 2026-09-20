import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";

/**
 * What the active SchoolYear should be for a given date, per this app's
 * Sept 1 – Jun 30 convention (see seed.ts / docs/plan.md). July/August is
 * a deliberate gap — no school year is "current" over summer, matching
 * how admins have always set these up manually.
 */
export function computeAcademicYearSpan(
  now: Date,
): { label: string; startsAt: Date; endsAt: Date } | null {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed; 8 = September

  if (month < 6) {
    // Jan–Jun: second half of the year that started last September.
    const startYear = year - 1;
    return {
      label: `${startYear}-${year}`,
      startsAt: new Date(startYear, 8, 1),
      endsAt: new Date(year, 5, 30),
    };
  }
  if (month >= 8) {
    // Sept–Dec: the year starting this September.
    return {
      label: `${year}-${year + 1}`,
      startsAt: new Date(year, 8, 1),
      endsAt: new Date(year + 1, 5, 30),
    };
  }
  return null; // Jul/Aug: summer gap
}

/**
 * Creates 3 evenly-split default trimesters for a school year, but only
 * if it has none yet — never overwrites trimesters an admin already set
 * up or customized.
 */
export async function ensureDefaultTrimesters(schoolYearId: string, startsAt: Date, endsAt: Date) {
  const existing = await prisma.trimester.count({ where: { schoolYearId } });
  if (existing > 0) return;

  const totalMs = endsAt.getTime() - startsAt.getTime();
  const third = totalMs / 3;
  const t1End = new Date(startsAt.getTime() + third);
  const t2End = new Date(startsAt.getTime() + third * 2);

  await prisma.trimester.createMany({
    data: [
      { label: "Trimester 1", startsAt, endsAt: t1End, schoolYearId },
      { label: "Trimester 2", startsAt: addDays(t1End, 1), endsAt: t2End, schoolYearId },
      { label: "Trimester 3", startsAt: addDays(t2End, 1), endsAt, schoolYearId },
    ],
  });
}

/**
 * Automatic lifecycle check, run periodically (see instrumentation.ts):
 * makes sure the SchoolYear matching today's date is the active one —
 * creating it (and its default trimesters) the first time this ever runs
 * after a Sept 1, or reactivating it if an admin's manual action left a
 * different one active. Idempotent and safe to call as often as needed;
 * a no-op in the Jul/Aug gap or once the right year is already active.
 */
export async function ensureCurrentSchoolYear() {
  const span = computeAcademicYearSpan(new Date());
  if (!span) return null;

  let schoolYear = await prisma.schoolYear.findUnique({ where: { label: span.label } });

  if (!schoolYear) {
    schoolYear = await prisma.$transaction(async (tx) => {
      await tx.schoolYear.updateMany({ where: { isActive: true }, data: { isActive: false } });
      return tx.schoolYear.create({
        data: { label: span.label, startsAt: span.startsAt, endsAt: span.endsAt, isActive: true },
      });
    });
  } else if (!schoolYear.isActive) {
    await prisma.$transaction([
      prisma.schoolYear.updateMany({ where: { isActive: true }, data: { isActive: false } }),
      prisma.schoolYear.update({ where: { id: schoolYear.id }, data: { isActive: true } }),
    ]);
  }

  await ensureDefaultTrimesters(schoolYear.id, schoolYear.startsAt, schoolYear.endsAt);
  return schoolYear;
}
