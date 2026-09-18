import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string }>;
}) {
  const { schoolYearId } = await searchParams;

  const schoolYears = await prisma.schoolYear.findMany({ orderBy: { startsAt: "desc" } });
  const activeYear = schoolYears.find((y) => y.isActive) ?? schoolYears[0];
  const selectedYear = schoolYears.find((y) => y.id === schoolYearId) ?? activeYear;

  const events = selectedYear
    ? await prisma.event.findMany({
        where: { schoolYearId: selectedYear.id },
        orderBy: { startAt: "desc" },
        include: { series: { select: { title: true } } },
      })
    : [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow dark:bg-brand-500 dark:hover:bg-brand-400"
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

      <form className="flex gap-3 text-sm">
        <select
          name="schoolYearId"
          defaultValue={selectedYear?.id}
          className="rounded-lg border border-brand-600/25 bg-white px-3 py-2 shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-brand-400/25 dark:bg-brand-950"
        >
          {schoolYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
              {y.isActive ? " (actief)" : ""}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-brand-600/30 px-4 py-2 transition-colors hover:bg-brand-600/5 dark:border-brand-400/30 dark:hover:bg-brand-400/5"
        >
          Filteren
        </button>
      </form>

      {events.length === 0 ? (
        <p className="text-sm text-zinc-500">Geen events in dit schooljaar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-600/15 text-zinc-500 dark:border-brand-400/15">
                <th className="py-2 pr-4">Titel</th>
                <th className="py-2 pr-4">Wanneer</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Punten</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-brand-600/10 transition-colors hover:bg-brand-600/5 dark:border-brand-400/10 dark:hover:bg-brand-400/5"
                >
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
      )}
    </div>
  );
}
