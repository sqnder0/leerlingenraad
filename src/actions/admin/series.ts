"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { extendSeriesRoster } from "@/lib/rotation";

const seriesSchema = z.object({
  title: z.string().trim().min(1, "Titel is verplicht."),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Ongeldig tijdstip."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Ongeldig tijdstip."),
  pointValue: z.coerce.number().int().min(0),
  membersNeeded: z.coerce.number().int().min(1),
  weeksAhead: z.coerce.number().int().min(1).max(52),
  assignmentMode: z.enum(["ROTATION", "EVERYONE", "SPECIFIC"]),
});

export type SeriesFormState = { status: "idle" } | { status: "error"; message: string };

function parseSeriesForm(formData: FormData) {
  return seriesSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    pointValue: formData.get("pointValue"),
    membersNeeded: formData.get("membersNeeded") || "1",
    weeksAhead: formData.get("weeksAhead") || "4",
    assignmentMode: formData.get("assignmentMode") || "ROTATION",
  });
}

function inviteIdsFromForm(formData: FormData, mode: string) {
  return mode === "SPECIFIC" ? formData.getAll("inviteUserIds").map(String) : [];
}

export async function createSeries(
  _prevState: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  const admin = await requireAdmin();

  const parsed = parseSeriesForm(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const activeSchoolYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeSchoolYear) {
    return { status: "error", message: "Geen actief schooljaar ingesteld." };
  }

  const inviteUserIds = inviteIdsFromForm(formData, parsed.data.assignmentMode);

  const series = await prisma.recurringSeries.create({
    data: { ...parsed.data, schoolYearId: activeSchoolYear.id, createdById: admin.id },
  });
  if (inviteUserIds.length > 0) {
    await prisma.recurringSeriesInvite.createMany({
      data: inviteUserIds.map((userId) => ({ seriesId: series.id, userId })),
      skipDuplicates: true,
    });
  }

  // Populate the rolling window right away rather than waiting for the
  // next periodic tick (see instrumentation.ts).
  await extendSeriesRoster(series.id);

  revalidatePath("/admin/series");
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { status: "idle" };
}

export async function updateSeries(
  seriesId: string,
  _prevState: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  await requireAdmin();

  const parsed = parseSeriesForm(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const inviteUserIds = inviteIdsFromForm(formData, parsed.data.assignmentMode);

  await prisma.$transaction([
    prisma.recurringSeries.update({ where: { id: seriesId }, data: parsed.data }),
    prisma.recurringSeriesInvite.deleteMany({ where: { seriesId } }),
    ...(inviteUserIds.length > 0
      ? [
          prisma.recurringSeriesInvite.createMany({
            data: inviteUserIds.map((userId) => ({ seriesId, userId })),
          }),
        ]
      : []),
  ]);

  await extendSeriesRoster(seriesId);

  revalidatePath("/admin/series");
  revalidatePath(`/admin/series/${seriesId}/edit`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { status: "idle" };
}

export async function toggleSeriesActive(seriesId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.recurringSeries.update({ where: { id: seriesId }, data: { isActive } });
  if (isActive) await extendSeriesRoster(seriesId);
  revalidatePath("/admin/series");
}

/** Manual "Genereer nu" trigger — tops up the rolling window immediately
 * instead of waiting for the next periodic tick. */
export async function extendSeriesRosterAction(seriesId: string) {
  await requireAdmin();
  await extendSeriesRoster(seriesId);
  revalidatePath("/admin/series");
  revalidatePath("/events");
  revalidatePath("/dashboard");
}
