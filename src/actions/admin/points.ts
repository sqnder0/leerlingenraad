"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { addManualAdjustment } from "@/lib/data/points";

const adjustmentSchema = z.object({
  delta: z.coerce
    .number()
    .int()
    .refine((n) => n !== 0, "Aanpassing mag niet 0 zijn."),
  reason: z.string().trim().min(1, "Reden is verplicht."),
});

export type AdjustmentState = { status: "idle" } | { status: "error"; message: string };

export async function createManualAdjustment(
  userId: string,
  _prevState: AdjustmentState,
  formData: FormData,
): Promise<AdjustmentState> {
  const admin = await requireAdmin();

  const parsed = adjustmentSchema.safeParse({
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const activeSchoolYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeSchoolYear) {
    return { status: "error", message: "Geen actief schooljaar ingesteld." };
  }

  await addManualAdjustment(
    userId,
    parsed.data.delta,
    parsed.data.reason,
    activeSchoolYear.id,
    admin.id,
  );

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/points");
  return { status: "idle" };
}
