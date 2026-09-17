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
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Agenda</h1>

      {events.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">Nog geen events gepland.</p>
      )}

      <ul className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
        {events.map((event) => {
          const mySignup = event.signups[0];
          return (
            <li key={event.id} className="py-3">
              <Link href={`/events/${event.id}`} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">{event.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(event.startAt)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
                {mySignup?.autoAssigned && mySignup.response === "GOING" && (
                  <span className="rounded bg-black/[.06] px-2 py-1 text-xs font-medium dark:bg-white/[.08]">
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
