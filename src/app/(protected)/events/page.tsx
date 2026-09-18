import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

export default async function EventsPage() {
  const user = await getCurrentUser();
  const events = await prisma.event.findMany({
    where: { status: { in: ["PUBLISHED", "COMPLETED"] } },
    orderBy: { startAt: "asc" },
    include: {
      signups: { where: { userId: user?.id }, select: { response: true, autoAssigned: true } },
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">Agenda</h1>

      {events.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">Nog geen events gepland.</p>
      )}

      <ul className="flex flex-col gap-1.5">
        {events.map((event) => {
          const mySignup = event.signups[0];
          return (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex flex-col gap-1 rounded-lg border border-brand-600/10 px-3 py-3 transition-colors hover:border-brand-600/25 hover:bg-brand-600/5 sm:flex-row sm:items-center sm:justify-between dark:border-brand-400/10 dark:hover:border-brand-400/25 dark:hover:bg-brand-400/5"
              >
                <div>
                  <p className="font-medium text-brand-900 dark:text-brand-50">{event.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(event.startAt)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
                {mySignup?.autoAssigned && mySignup.response === "GOING" && (
                  <span className="rounded-full bg-brand-600/10 px-2.5 py-1 text-xs font-medium text-brand-800 dark:bg-brand-400/15 dark:text-brand-100">
                    Toegewezen
                  </span>
                )}
                {mySignup && !mySignup.autoAssigned && (
                  <span className="text-xs text-zinc-500">
                    {mySignup.response === "GOING" ? "Aangemeld" : "Afgemeld"}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
