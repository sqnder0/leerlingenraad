import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startAt: "desc" },
    include: { series: { select: { title: true } } },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Nieuw event
        </Link>
      </div>

      <p className="text-sm text-zinc-500">
        Terugkerende duty-events beheer je via{" "}
        <Link href="/admin/series" className="underline">
          Terugkerende events
        </Link>{" "}
        en{" "}
        <Link href="/admin/trimesters" className="underline">
          Trimesters
        </Link>
        .
      </p>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-zinc-500 dark:border-white/10">
            <th className="py-2 pr-4">Titel</th>
            <th className="py-2 pr-4">Wanneer</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Punten</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2 pr-4">
                {event.title}
                {event.series && (
                  <span className="ml-2 text-xs text-zinc-500">({event.series.title})</span>
                )}
              </td>
              <td className="py-2 pr-4">
                {new Intl.DateTimeFormat("nl-BE", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(event.startAt)}
              </td>
              <td className="py-2 pr-4">{event.status}</td>
              <td className="py-2 pr-4">{event.pointValue}</td>
              <td className="py-2 pr-4">
                <Link
                  href={`/admin/events/${event.id}/edit`}
                  className="underline underline-offset-2"
                >
                  Bewerken
                </Link>
                {event.status !== "DRAFT" && event.status !== "CANCELLED" && (
                  <Link
                    href={`/admin/events/${event.id}/attendance`}
                    className="ml-3 underline underline-offset-2"
                  >
                    Aanwezigheid
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
