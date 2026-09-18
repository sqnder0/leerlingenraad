import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminTrimestersPage() {
  const trimesters = await prisma.trimester.findMany({ orderBy: { startsAt: "desc" } });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Trimesters</h1>
        <Link
          href="/admin/trimesters/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Nieuw trimester
        </Link>
      </div>

      {trimesters.length === 0 ? (
        <p className="text-sm text-zinc-500">Nog geen trimesters aangemaakt.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
          {trimesters.map((t) => (
            <li key={t.id} className="py-3">
              <Link
                href={`/admin/trimesters/${t.id}`}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-black dark:text-zinc-50">{t.label}</span>
                <span className="text-sm text-zinc-500">
                  {new Intl.DateTimeFormat("nl-BE").format(t.startsAt)} –{" "}
                  {new Intl.DateTimeFormat("nl-BE").format(t.endsAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
