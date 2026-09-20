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
 * Automatic lifecycle check, run periodically (see instrumentation.ts):
 * makes sure the SchoolYear matching today's date is the active one —
 * creating it the first time this ever runs after a Sept 1, or
 * reactivating it if an admin's manual action left a different one
 * active. Idempotent and safe to call as often as needed; a no-op in the
 * Jul/Aug gap or once the right year is already active.
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

  return schoolYear;
}
