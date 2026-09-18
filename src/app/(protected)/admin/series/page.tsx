import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleSeriesActive } from "@/actions/admin/series";

const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

export default async function AdminSeriesPage() {
  const series = await prisma.recurringSeries.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">
          Terugkerende events
        </h1>
        <Link
          href="/admin/series/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          Nieuw
        </Link>
      </div>
      <p className="text-sm text-zinc-500">
        Genereer roosters per trimester via{" "}
        <Link href="/admin/trimesters" className="underline">
          Trimesters
        </Link>
        .
      </p>

      {series.length === 0 ? (
        <p className="text-sm text-zinc-500">Nog geen terugkerende events aangemaakt.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-600/15 text-zinc-500 dark:border-brand-400/15">
                <th className="py-2 pr-4">Titel</th>
                <th className="py-2 pr-4">Dag</th>
                <th className="py-2 pr-4">Tijd</th>
                <th className="py-2 pr-4">Personen</th>
                <th className="py-2 pr-4">Punten</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-brand-600/10 transition-colors hover:bg-brand-600/5 dark:border-brand-400/10 dark:hover:bg-brand-400/5"
                >
                  <td className="py-2 pr-4">{s.title}</td>
                  <td className="py-2 pr-4">{DAYS[s.dayOfWeek]}</td>
                  <td className="py-2 pr-4">
                    {s.startTime}–{s.endTime}
                  </td>
                  <td className="py-2 pr-4">{s.membersNeeded}</td>
                  <td className="py-2 pr-4">{s.pointValue}</td>
                  <td className="py-2 pr-4">
                    <form action={toggleSeriesActive.bind(null, s.id, !s.isActive)}>
                      <button type="submit" className="underline underline-offset-2">
                        {s.isActive ? "Deactiveren" : "Activeren"}
                      </button>
                    </form>
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
