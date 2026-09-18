import Link from "next/link";
import { requireApprovedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { rsvp, declineAssignment } from "@/actions/member-actions";
import { NotificationOptIn } from "@/components/notification-opt-in";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(date);
}

export default async function DashboardPage() {
  const user = await requireApprovedUser();
  const now = new Date();

  const [expected, optInEvents] = await Promise.all([
    // Opt-out: duty/rotation slots you're auto-assigned to and still on the
    // hook for — "Ik kan niet" declines and triggers reassignment.
    prisma.signup.findMany({
      where: {
        userId: user.id,
        autoAssigned: true,
        response: "GOING",
        event: { startAt: { gte: now }, status: "PUBLISHED" },
      },
      include: { event: true },
      orderBy: { event: { startAt: "asc" } },
      take: 10,
    }),
    // Opt-in: ordinary events, with your current RSVP (if any) alongside.
    prisma.event.findMany({
      where: { seriesId: null, status: "PUBLISHED", startAt: { gte: now } },
      include: { signups: { where: { userId: user.id }, select: { response: true } } },
      orderBy: { startAt: "asc" },
      take: 10,
    }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">
        Welkom, {user.firstName}
      </h1>

      <NotificationOptIn />

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-500">Verwacht van jou</p>
        {expected.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Geen toegewezen beurten gepland.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {expected.map((signup) => (
              <li
                key={signup.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-brand-600/10 px-3 py-2 transition-colors hover:border-brand-600/25 hover:bg-brand-600/5 dark:border-brand-400/10 dark:hover:border-brand-400/25 dark:hover:bg-brand-400/5"
              >
                <Link href={`/events/${signup.eventId}`} className="flex-1">
                  <p className="font-medium text-brand-900 dark:text-brand-50">
                    {signup.event.title}
                  </p>
                  <p className="text-sm text-zinc-500">{formatWhen(signup.event.startAt)}</p>
                </Link>
                <form action={declineAssignment.bind(null, signup.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-brand-600/30 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-brand-600/5 dark:border-brand-400/30 dark:hover:bg-brand-400/5"
                  >
                    Ik kan niet
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-500">Opt-in events</p>
        {optInEvents.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Nog geen events gepland.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {optInEvents.map((event) => {
              const response = event.signups[0]?.response;
              return (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-brand-600/10 px-3 py-2 transition-colors hover:border-brand-600/25 hover:bg-brand-600/5 dark:border-brand-400/10 dark:hover:border-brand-400/25 dark:hover:bg-brand-400/5"
                >
                  <Link href={`/events/${event.id}`} className="flex-1">
                    <p className="font-medium text-brand-900 dark:text-brand-50">{event.title}</p>
                    <p className="text-sm text-zinc-500">{formatWhen(event.startAt)}</p>
                  </Link>
                  <div className="flex gap-2">
                    <form action={rsvp.bind(null, event.id, "GOING")}>
                      <button
                        type="submit"
                        className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                          response === "GOING"
                            ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
                            : "border border-brand-600/30 hover:bg-brand-600/5 dark:border-brand-400/30 dark:hover:bg-brand-400/5"
                        }`}
                      >
                        Ik kom
                      </button>
                    </form>
                    <form action={rsvp.bind(null, event.id, "NOT_GOING")}>
                      <button
                        type="submit"
                        className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                          response === "NOT_GOING"
                            ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
                            : "border border-brand-600/30 hover:bg-brand-600/5 dark:border-brand-400/30 dark:hover:bg-brand-400/5"
                        }`}
                      >
                        Ik kom niet
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/events" className="text-sm underline underline-offset-2">
          Volledige agenda
        </Link>
      </section>
    </div>
  );
}
