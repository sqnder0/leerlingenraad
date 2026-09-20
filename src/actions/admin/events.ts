"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const eventSchema = z.object({
  title: z.string().trim().min(1, "Titel is verplicht."),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  startAt: z.string().min(1, "Startdatum/tijd is verplicht."),
  endAt: z.string().min(1, "Einddatum/tijd is verplicht."),
  pointValue: z.coerce.number().int().min(0),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]),
});

export type EventFormState = { status: "idle" } | { status: "error"; message: string };

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const admin = await requireAdmin();

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    pointValue: formData.get("pointValue"),
    status: formData.get("status") ?? "DRAFT",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const activeSchoolYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeSchoolYear) {
    return { status: "error", message: "Geen actief schooljaar ingesteld." };
  }
  const schoolYearId = activeSchoolYear.id;

  await prisma.event.create({
    data: {
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      schoolYearId,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { status: "idle" };
}

/** One-click publish for a draft event, used from the agenda's admin quick-action. */
export async function publishEvent(eventId: string) {
  await requireAdmin();

  await prisma.event.update({
    where: { id: eventId },
    data: { status: "PUBLISHED" },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
}

/**
 * Real delete, not just a status change — removes the event and its
 * signups (cascade). Points-ledger entries tied to it keep their history
 * but lose the event reference (onDelete: SetNull on PointsLedger.event).
 */
export async function deleteEvent(eventId: string) {
  await requireAdmin();
  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/dashboard");
}

export async function updateEvent(
  eventId: string,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    pointValue: formData.get("pointValue"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
    },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  return { status: "idle" };
}
