import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminEventsList, type AdminEventRow } from "@/components/admin/admin-events-list";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

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

  const rows: AdminEventRow[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    seriesTitle: event.series?.title ?? null,
    when: new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(event.startAt),
    status: event.status,
    pointValue: event.pointValue,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-900">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow"
        >
          Nieuw event
        </Link>
      </div>

      <p className="text-sm text-zinc-500">
        Terugkerende duty-events beheer je via{" "}
        <Link href="/admin/series" className="underline">
          Terugkerende events
        </Link>
        .
      </p>

      <form className="flex gap-3 text-sm">
        <select
          name="schoolYearId"
          defaultValue={selectedYear?.id}
          className="rounded-lg border border-brand-600/25 bg-white px-3 py-2 shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30"
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
          className="rounded-lg border border-brand-600/30 px-4 py-2 transition-colors hover:bg-brand-600/5"
        >
          Filteren
        </button>
      </form>

      <AdminEventsList events={rows} />
    </div>
  );
}
