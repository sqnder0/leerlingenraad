import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminTrimestersPage() {
  const trimesters = await prisma.trimester.findMany({ orderBy: { startsAt: "desc" } });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-900">Trimesters</h1>
        <Link
          href="/admin/trimesters/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow"
        >
          Nieuw trimester
        </Link>
      </div>

      {trimesters.length === 0 ? (
        <p className="text-sm text-zinc-500">Nog geen trimesters aangemaakt.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {trimesters.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/trimesters/${t.id}`}
                className="flex flex-col gap-1 rounded-lg border border-brand-600/10 px-3 py-3 transition-colors hover:border-brand-600/25 hover:bg-brand-600/5 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-brand-900">{t.label}</span>
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
