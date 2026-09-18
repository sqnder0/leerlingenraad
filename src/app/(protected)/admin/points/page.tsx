import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBalances } from "@/lib/data/points";

export default async function PointsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolYearId?: string; classGroup?: string }>;
}) {
  const { schoolYearId, classGroup } = await searchParams;

  const schoolYears = await prisma.schoolYear.findMany({ orderBy: { startsAt: "desc" } });
  const activeYear = schoolYears.find((y) => y.isActive) ?? schoolYears[0];
  const selectedYear = schoolYears.find((y) => y.id === schoolYearId) ?? activeYear;

  const classGroups = await prisma.user
    .findMany({
      where: { status: "APPROVED", isTeacher: false, classGroup: { not: null } },
      distinct: ["classGroup"],
      select: { classGroup: true },
      orderBy: { classGroup: "asc" },
    })
    .then((rows) => rows.map((r) => r.classGroup!));

  const balances = selectedYear
    ? (await getBalances(selectedYear.id, classGroup || undefined)).sort(
        (a, b) => b.balance - a.balance,
      )
    : [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">Puntendashboard</h1>

      <form className="flex flex-wrap gap-3 text-sm">
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
        <select
          name="classGroup"
          defaultValue={classGroup ?? ""}
          className="rounded-lg border border-brand-600/25 bg-white px-3 py-2 shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-brand-400/25 dark:bg-brand-950"
        >
          <option value="">Alle klassen</option>
          {classGroups.map((c) => (
            <option key={c} value={c}>
              {c}
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

      {!selectedYear ? (
        <p className="text-sm text-zinc-500">Geen schooljaar ingesteld.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-600/15 text-zinc-500 dark:border-brand-400/15">
                <th className="py-2 pr-4">Naam</th>
                <th className="py-2 pr-4">Klas</th>
                <th className="py-2 pr-4">Balans</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-brand-600/10 transition-colors hover:bg-brand-600/5 dark:border-brand-400/10 dark:hover:bg-brand-400/5"
                >
                  <td className="py-2 pr-4">
                    <Link href={`/admin/members/${m.id}`} className="underline underline-offset-2">
                      {m.firstName} {m.lastName}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{m.classGroup ?? "—"}</td>
                  <td className="py-2 pr-4">{m.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
