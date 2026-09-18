import { prisma } from "@/lib/prisma";
import { sendPushToUser, pushEnabled } from "@/lib/push";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Finds every confirmed signup (opt-in RSVP or accepted duty assignment)
 * for an event starting in ~24h and sends a one-time push reminder.
 *
 * The 23h-25h window (rather than exactly 24h) tolerates the periodic
 * check firing a bit early/late or missing a beat (e.g. a deploy restart)
 * without ever double-sending — `reminderSentAt` is the actual guard.
 */
export async function sendUpcomingEventReminders() {
  if (!pushEnabled) return;

  const now = Date.now();
  const windowStart = new Date(now + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now + 25 * 60 * 60 * 1000);

  const dueSignups = await prisma.signup.findMany({
    where: {
      response: "GOING",
      reminderSentAt: null,
      event: {
        status: "PUBLISHED",
        startAt: { gte: windowStart, lte: windowEnd },
      },
    },
    include: { event: true },
  });

  for (const signup of dueSignups) {
    const when = new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(signup.event.startAt);
    const lead = signup.autoAssigned
      ? "Je bent morgen aan de beurt"
      : "Je hebt je aangemeld voor morgen";
    await sendPushToUser(signup.userId, {
      title: signup.event.title,
      body: `${lead} (${when})${signup.event.location ? ` · ${signup.event.location}` : ""}`,
      url: `/events/${signup.eventId}`,
    });
    await prisma.signup.update({
      where: { id: signup.id },
      data: { reminderSentAt: new Date() },
    });
  }
}
