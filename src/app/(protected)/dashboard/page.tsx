import Link from "next/link";
import { requireApprovedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

export default async function DashboardPage() {
  const user = await requireApprovedUser();

  const upcoming = await prisma.signup.findMany({
    where: {
      userId: user.id,
      response: "GOING",
      event: { startAt: { gte: new Date() }, status: { in: ["PUBLISHED", "DRAFT"] } },
    },
    include: { event: true },
    orderBy: { event: { startAt: "asc" } },
    take: 5,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
        Welkom, {user.firstName}
      </h1>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-500">Binnenkort</p>
        {upcoming.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Niets gepland. Bekijk de{" "}
            <Link href="/events" className="underline">
              agenda
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
            {upcoming.map((s) => (
              <li key={s.id} className="py-2">
                <Link
                  href={`/events/${s.eventId}`}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>{s.event.title}</span>
                  <span className="text-sm text-zinc-500">
                    {new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(s.event.startAt)}
                    {s.autoAssigned ? " · toegewezen" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
