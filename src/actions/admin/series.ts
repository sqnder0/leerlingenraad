"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const seriesSchema = z.object({
  title: z.string().trim().min(1, "Titel is verplicht."),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Ongeldig tijdstip."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Ongeldig tijdstip."),
  pointValue: z.coerce.number().int().min(0),
  membersNeeded: z.coerce.number().int().min(1),
});

export type SeriesFormState = { status: "idle" } | { status: "error"; message: string };

export async function createSeries(
  _prevState: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  const admin = await requireAdmin();

  const parsed = seriesSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    pointValue: formData.get("pointValue"),
    membersNeeded: formData.get("membersNeeded"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const activeSchoolYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeSchoolYear) {
    return { status: "error", message: "Geen actief schooljaar ingesteld." };
  }

  await prisma.recurringSeries.create({
    data: { ...parsed.data, schoolYearId: activeSchoolYear.id, createdById: admin.id },
  });

  revalidatePath("/admin/series");
  return { status: "idle" };
}

export async function toggleSeriesActive(seriesId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.recurringSeries.update({ where: { id: seriesId }, data: { isActive } });
  revalidatePath("/admin/series");
}
