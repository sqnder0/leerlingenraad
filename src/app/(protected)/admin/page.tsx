import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const pendingCount = await prisma.user.count({ where: { status: "PENDING" } });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">Beheer</h1>

      <Link
        href="/admin/members"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md dark:border-brand-400/15 dark:hover:border-brand-400/30 dark:hover:bg-brand-400/5"
      >
        <p className="font-medium text-brand-900 dark:text-brand-50">Leden</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {pendingCount === 0
            ? "Geen aanvragen in afwachting."
            : `${pendingCount} account${pendingCount === 1 ? "" : "s"} wacht${pendingCount === 1 ? "" : "en"} op goedkeuring.`}
        </p>
      </Link>

      <Link
        href="/admin/events"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md dark:border-brand-400/15 dark:hover:border-brand-400/30 dark:hover:bg-brand-400/5"
      >
        <p className="font-medium text-brand-900 dark:text-brand-50">Events</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Eenmalige events beheren.</p>
      </Link>

      <Link
        href="/admin/series"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md dark:border-brand-400/15 dark:hover:border-brand-400/30 dark:hover:bg-brand-400/5"
      >
        <p className="font-medium text-brand-900 dark:text-brand-50">Terugkerende events</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Wekelijkse beurten (bv. schoolwinkeltje).
        </p>
      </Link>

      <Link
        href="/admin/trimesters"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md dark:border-brand-400/15 dark:hover:border-brand-400/30 dark:hover:bg-brand-400/5"
      >
        <p className="font-medium text-brand-900 dark:text-brand-50">Trimesters</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Roosters genereren en eerlijke verdeling bekijken.
        </p>
      </Link>

      <Link
        href="/admin/school-years"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md dark:border-brand-400/15 dark:hover:border-brand-400/30 dark:hover:bg-brand-400/5"
      >
        <p className="font-medium text-brand-900 dark:text-brand-50">Schooljaren</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Archiveren en nieuw jaar starten.
        </p>
      </Link>

      <Link
        href="/admin/vrijroosteren"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md dark:border-brand-400/15 dark:hover:border-brand-400/30 dark:hover:bg-brand-400/5"
      >
        <p className="font-medium text-brand-900 dark:text-brand-50">Vrijroosteren</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Rapport voor het schoolsecretariaat, printbaar of als CSV.
        </p>
      </Link>

      <Link
        href="/admin/points"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md dark:border-brand-400/15 dark:hover:border-brand-400/30 dark:hover:bg-brand-400/5"
      >
        <p className="font-medium text-brand-900 dark:text-brand-50">Puntendashboard</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Eerlijkheid per lid, dit schooljaar.
        </p>
      </Link>
    </div>
  );
}
