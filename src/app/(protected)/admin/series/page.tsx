import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleSeriesActive, extendSeriesRosterAction } from "@/actions/admin/series";

const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const MODE_LABELS: Record<string, string> = {
  ROTATION: "Rotatie",
  EVERYONE: "Iedereen",
  SPECIFIC: "Specifiek",
};

export default async function AdminSeriesPage() {
  const series = await prisma.recurringSeries.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { invitedMembers: true } } },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-900">Terugkerende events</h1>
        <Link
          href="/admin/series/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow"
        >
          Nieuw
        </Link>
      </div>
      <p className="text-sm text-zinc-500">
        Elke actieve reeks vult haar rooster automatisch aan tot haar eigen &ldquo;weken
        vooruit&rdquo;-venster. Wil je niet wachten op de volgende automatische aanvulling, gebruik
        dan &ldquo;Genereer nu&rdquo;.
      </p>

      {series.length === 0 ? (
        <p className="text-sm text-zinc-500">Nog geen terugkerende events aangemaakt.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-600/15 text-zinc-500">
                <th className="py-2 pr-4">Titel</th>
                <th className="py-2 pr-4">Dag</th>
                <th className="py-2 pr-4">Tijd</th>
                <th className="py-2 pr-4">Wie</th>
                <th className="py-2 pr-4">Punten</th>
                <th className="py-2 pr-4">Weken vooruit</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-brand-600/10 transition-colors hover:bg-brand-600/5"
                >
                  <td className="py-2 pr-4">
                    <Link
                      href={`/admin/series/${s.id}/edit`}
                      className="underline underline-offset-2"
                    >
                      {s.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{DAYS[s.dayOfWeek]}</td>
                  <td className="py-2 pr-4">
                    {s.startTime}–{s.endTime}
                  </td>
                  <td className="py-2 pr-4">
                    {MODE_LABELS[s.assignmentMode]}
                    {s.assignmentMode === "ROTATION" && ` (${s.membersNeeded})`}
                    {s.assignmentMode === "SPECIFIC" && ` (${s._count.invitedMembers})`}
                  </td>
                  <td className="py-2 pr-4">{s.pointValue}</td>
                  <td className="py-2 pr-4">{s.weeksAhead}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <form
                      action={toggleSeriesActive.bind(null, s.id, !s.isActive)}
                      className="inline"
                    >
                      <button type="submit" className="underline underline-offset-2">
                        {s.isActive ? "Deactiveren" : "Activeren"}
                      </button>
                    </form>
                    {s.isActive && (
                      <form
                        action={extendSeriesRosterAction.bind(null, s.id)}
                        className="ml-3 inline"
                      >
                        <button type="submit" className="underline underline-offset-2">
                          Genereer nu
                        </button>
                      </form>
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
