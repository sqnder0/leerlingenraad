"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { confirmAttendance } from "@/lib/data/points";

export type AttendanceState = { status: "idle" } | { status: "error"; message: string };

export async function submitAttendance(
  eventId: string,
  _prevState: AttendanceState,
  formData: FormData,
): Promise<AttendanceState> {
  const admin = await requireAdmin();

  const signupIds = formData.getAll("signupId").map(String);
  if (signupIds.length === 0) {
    return { status: "error", message: "Geen aanmeldingen om te bevestigen." };
  }

  const attendance = signupIds.map((signupId) => ({
    signupId,
    attended: (formData.get(`attended-${signupId}`) === "PRESENT" ? "PRESENT" : "ABSENT") as
      "PRESENT" | "ABSENT",
  }));

  await confirmAttendance(eventId, attendance, admin.id);

  revalidatePath(`/admin/events/${eventId}/attendance`);
  revalidatePath("/admin/events");
  revalidatePath("/admin/points");
  return { status: "idle" };
}
