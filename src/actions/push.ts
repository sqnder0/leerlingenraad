"use server";

import { z } from "zod";
import { requireApprovedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/** Called after the browser grants notification permission and subscribes. */
export async function subscribeToPush(subscription: unknown) {
  const user = await requireApprovedUser();
  const parsed = subscriptionSchema.parse(subscription);

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.endpoint },
    update: { userId: user.id, p256dh: parsed.keys.p256dh, auth: parsed.keys.auth },
    create: {
      userId: user.id,
      endpoint: parsed.endpoint,
      p256dh: parsed.keys.p256dh,
      auth: parsed.keys.auth,
    },
  });
}

/** Called when a member turns notifications back off on this device. */
export async function unsubscribeFromPush(endpoint: string) {
  await requireApprovedUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}
