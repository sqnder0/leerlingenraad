import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

export const pushEnabled = Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);

if (pushEnabled) {
  webpush.setVapidDetails(vapidSubject!, vapidPublicKey!, vapidPrivateKey!);
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

/**
 * Sends a push notification to every device a user has subscribed on.
 * Prunes subscriptions the push service reports as gone (410/404) — the
 * usual reason is the member uninstalled the PWA or cleared site data.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!pushEnabled) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  const json = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          json,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`Push naar subscription ${sub.id} mislukt:`, err);
        }
      }
    }),
  );
}
