import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GenerateRosterForm } from "./generate-form";

export default async function TrimesterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const trimester = await prisma.trimester.findUnique({ where: { id } });
  if (!trimester) notFound();

  const [activeSeries, events, pool] = await Promise.all([
    prisma.recurringSeries.findMany({ where: { isActive: true }, orderBy: { title: "asc" } }),
    prisma.event.findMany({
      where: { trimesterId: id },
      orderBy: { startAt: "asc" },
      include: {
        series: { select: { title: true } },
        signups: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { status: "APPROVED", isTeacher: false },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { username: "asc" },
    }),
  ]);

  // Fairness table: count of autoAssigned GOING signups per pool member.
  const counts = new Map(pool.map((u) => [u.id, 0]));
  for (const event of events) {
    for (const s of event.signups) {
      if (s.autoAssigned && s.response === "GOING" && counts.has(s.userId)) {
        counts.set(s.userId, (counts.get(s.userId) ?? 0) + 1);
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">
          {trimester.label}
        </h1>
        <p className="text-sm text-zinc-500">
          {new Intl.DateTimeFormat("nl-BE").format(trimester.startsAt)} –{" "}
          {new Intl.DateTimeFormat("nl-BE").format(trimester.endsAt)}
        </p>
      </div>

      <GenerateRosterForm trimesterId={trimester.id} series={activeSeries} />

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-500">Eerlijkheid (aantal beurten)</p>
        <ul className="flex flex-wrap gap-2 text-sm">
          {pool.map((u) => (
            <li key={u.id} className="rounded bg-brand-600/10 px-2 py-1 dark:bg-brand-400/15">
              {u.firstName}: {counts.get(u.id) ?? 0}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-500">Rooster</p>
        {events.length === 0 ? (
          <p className="text-sm text-zinc-500">Nog geen rooster gegenereerd.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-600/15 text-zinc-500 dark:border-brand-400/15">
                  <th className="py-2 pr-4">Datum</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Toegewezen</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-brand-600/10 dark:border-brand-400/10"
                  >
                    <td className="py-2 pr-4">
                      {new Intl.DateTimeFormat("nl-BE", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      }).format(event.startAt)}
                    </td>
                    <td className="py-2 pr-4">{event.title}</td>
                    <td className="py-2 pr-4">
                      {event.signups
                        .filter((s) => s.response === "GOING")
                        .map((s) => `${s.user.firstName} ${s.user.lastName}`)
                        .join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
