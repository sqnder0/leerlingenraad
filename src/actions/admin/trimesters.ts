"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { generateRosterForSeries } from "@/lib/rotation";

const trimesterSchema = z.object({
  label: z.string().trim().min(1, "Naam is verplicht."),
  startsAt: z.string().min(1, "Startdatum is verplicht."),
  endsAt: z.string().min(1, "Einddatum is verplicht."),
});

export type TrimesterFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; trimesterId: string };

export async function createTrimester(
  _prevState: TrimesterFormState,
  formData: FormData,
): Promise<TrimesterFormState> {
  await requireAdmin();

  const parsed = trimesterSchema.safeParse({
    label: formData.get("label"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const activeSchoolYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeSchoolYear) {
    return { status: "error", message: "Geen actief schooljaar ingesteld." };
  }

  const trimester = await prisma.trimester.create({
    data: {
      label: parsed.data.label,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      schoolYearId: activeSchoolYear.id,
    },
  });

  revalidatePath("/admin/trimesters");
  return { status: "success", trimesterId: trimester.id };
}

export type GenerateRosterState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; occurrencesCreated: number; totalOccurrences: number };

export async function generateRoster(
  trimesterId: string,
  _prevState: GenerateRosterState,
  formData: FormData,
): Promise<GenerateRosterState> {
  const admin = await requireAdmin();

  const seriesId = formData.get("seriesId");
  if (typeof seriesId !== "string" || !seriesId) {
    return { status: "error", message: "Kies een terugkerend event." };
  }

  const result = await generateRosterForSeries(seriesId, trimesterId, admin.id);
  revalidatePath(`/admin/trimesters/${trimesterId}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { status: "success", ...result };
}
