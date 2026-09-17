import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleSeriesActive } from "@/actions/admin/series";

const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

export default async function AdminSeriesPage() {
  const series = await prisma.recurringSeries.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Terugkerende events</h1>
        <Link
          href="/admin/series/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
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

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-zinc-500 dark:border-white/10">
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
            <tr key={s.id} className="border-b border-black/5 dark:border-white/5">
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
  );
}
