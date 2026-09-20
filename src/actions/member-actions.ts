"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { reassignSlot } from "@/lib/rotation";

/** Member's own RSVP toggle for an ordinary (non-rotation) event. */
export async function rsvp(eventId: string, response: "GOING" | "NOT_GOING") {
  const user = await requireApprovedUser();

  await prisma.signup.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    update: { response, respondedAt: new Date() },
    create: { eventId, userId: user.id, response },
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/my/signups");
  revalidatePath("/dashboard");
}

/**
 * A member declines a duty they were auto-assigned to. Keeps the signup
 * row (autoAssigned stays true, response flips to NOT_GOING — no penalty,
 * see docs/plan.md), then immediately reassigns the slot to whoever
 * currently has the lowest projected points balance this school year.
 */
export async function declineAssignment(signupId: string) {
  const user = await requireApprovedUser();

  const signup = await prisma.signup.findUniqueOrThrow({ where: { id: signupId } });
  if (signup.userId !== user.id) {
    throw new Error("Deze toewijzing is niet van jou.");
  }
  if (!signup.autoAssigned) {
    throw new Error("Dit is geen toegewezen beurt.");
  }

  await prisma.signup.update({
    where: { id: signupId },
    data: { response: "NOT_GOING", respondedAt: new Date() },
  });

  await reassignSlot(signup.eventId, user.id);

  revalidatePath(`/events/${signup.eventId}`);
  revalidatePath("/events");
  revalidatePath("/my/signups");
  revalidatePath("/dashboard");
}
