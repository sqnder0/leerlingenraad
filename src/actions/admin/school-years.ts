"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const schoolYearSchema = z.object({
  label: z.string().trim().min(1, "Naam is verplicht."),
  startsAt: z.string().min(1, "Startdatum is verplicht."),
  endsAt: z.string().min(1, "Einddatum is verplicht."),
});

export type StartSchoolYearState = { status: "idle" } | { status: "error"; message: string };

/**
 * "Archiving" a year, per docs/plan.md §1: no data is deleted, this just
 * flips which SchoolYear is active. Exactly one active at a time is
 * enforced here (a transaction), not by a DB constraint.
 */
export async function startNewSchoolYear(
  _prevState: StartSchoolYearState,
  formData: FormData,
): Promise<StartSchoolYearState> {
  await requireAdmin();

  const parsed = schoolYearSchema.safeParse({
    label: formData.get("label"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (endsAt <= startsAt) {
    return { status: "error", message: "Einddatum moet na de startdatum liggen." };
  }

  const existing = await prisma.schoolYear.findUnique({ where: { label: parsed.data.label } });
  if (existing) {
    return { status: "error", message: "Er bestaat al een schooljaar met die naam." };
  }

  await prisma.$transaction([
    prisma.schoolYear.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.schoolYear.create({
      data: { label: parsed.data.label, startsAt, endsAt, isActive: true },
    }),
  ]);

  revalidatePath("/admin/school-years");
  revalidatePath("/admin/points");
  revalidatePath("/admin/events");
  revalidatePath("/admin/series");
  return { status: "idle" };
}
