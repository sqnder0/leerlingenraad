import { getVrijroosterenRows } from "@/lib/data/vrijroosteren";
import { PrintButton } from "./print-button";

function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default async function VrijroosterenPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { start, end } = await searchParams;

  const today = new Date();
  const defaultEnd = new Date(today);
  defaultEnd.setDate(defaultEnd.getDate() + 7);

  const startDate = start ? startOfDay(new Date(start)) : startOfDay(today);
  const endDate = end ? endOfDay(new Date(end)) : endOfDay(defaultEnd);

  const rows = await getVrijroosterenRows(startDate, endDate);

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = new Intl.DateTimeFormat("nl-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(row.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const exportHref = `/admin/vrijroosteren/export?start=${toDateInputValue(startDate)}&end=${toDateInputValue(endDate)}`;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Vrijroosteren</h1>
      </div>

      <form className="flex flex-wrap items-end gap-3 text-sm print:hidden">
        <div className="flex flex-col gap-1">
          <label htmlFor="start" className="text-zinc-600 dark:text-zinc-400">
            Van
          </label>
          <input
            id="start"
            name="start"
            type="date"
            defaultValue={toDateInputValue(startDate)}
            className="rounded border border-black/15 bg-white px-3 py-2 dark:border-white/15 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="end" className="text-zinc-600 dark:text-zinc-400">
            Tot
          </label>
          <input
            id="end"
            name="end"
            type="date"
            defaultValue={toDateInputValue(endDate)}
            className="rounded border border-black/15 bg-white px-3 py-2 dark:border-white/15 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="rounded border border-black/15 px-3 py-2 dark:border-white/15"
        >
          Filteren
        </button>
        <a
          href={exportHref}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/15"
        >
          Exporteer CSV
        </a>
        <PrintButton />
      </form>

      <p className="hidden text-sm text-zinc-500 print:block">
        {new Intl.DateTimeFormat("nl-BE").format(startDate)} –{" "}
        {new Intl.DateTimeFormat("nl-BE").format(endDate)}
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Niemand vrij te roosteren in deze periode.</p>
      ) : (
        Array.from(groups.entries()).map(([date, dateRows]) => (
          <div key={date} className="break-inside-avoid">
            <p className="mb-1 font-medium capitalize text-black dark:text-zinc-50">{date}</p>
            <div className="overflow-x-auto">
              <table className="mb-4 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-zinc-500 dark:border-white/10 print:text-black">
                    <th className="py-1 pr-4">Naam</th>
                    <th className="py-1 pr-4">Klas</th>
                    <th className="py-1 pr-4">Event</th>
                  </tr>
                </thead>
                <tbody>
                  {dateRows.map((row, i) => (
                    <tr key={i} className="border-b border-black/5 dark:border-white/5">
                      <td className="py-1 pr-4">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="py-1 pr-4">{row.classGroup ?? "—"}</td>
                      <td className="py-1 pr-4">{row.eventTitle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
