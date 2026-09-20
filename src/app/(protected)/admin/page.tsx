import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const pendingCount = await prisma.user.count({ where: { status: "PENDING" } });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-brand-900">Beheer</h1>

      <Link
        href="/admin/members"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md"
      >
        <p className="font-medium text-brand-900">Leden</p>
        <p className="text-sm text-zinc-600">
          {pendingCount === 0
            ? "Geen aanvragen in afwachting."
            : `${pendingCount} account${pendingCount === 1 ? "" : "s"} wacht${pendingCount === 1 ? "" : "en"} op goedkeuring.`}
        </p>
      </Link>

      <Link
        href="/admin/invites"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md"
      >
        <p className="font-medium text-brand-900">Uitnodigingen</p>
        <p className="text-sm text-zinc-600">
          Links maken om nieuwe leden zichzelf te laten registreren.
        </p>
      </Link>

      <Link
        href="/admin/events"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md"
      >
        <p className="font-medium text-brand-900">Events</p>
        <p className="text-sm text-zinc-600">Eenmalige events beheren.</p>
      </Link>

      <Link
        href="/admin/series"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md"
      >
        <p className="font-medium text-brand-900">Terugkerende events</p>
        <p className="text-sm text-zinc-600">
          Wekelijkse beurten (bv. schoolwinkeltje) — rooster wordt automatisch aangevuld.
        </p>
      </Link>

      <Link
        href="/admin/school-years"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md"
      >
        <p className="font-medium text-brand-900">Schooljaren</p>
        <p className="text-sm text-zinc-600">Archiveren en nieuw jaar starten.</p>
      </Link>

      <Link
        href="/admin/vrijroosteren"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md"
      >
        <p className="font-medium text-brand-900">Vrijroosteren</p>
        <p className="text-sm text-zinc-600">
          Rapport voor het schoolsecretariaat, printbaar of als CSV.
        </p>
      </Link>

      <Link
        href="/admin/points"
        className="rounded-xl border border-brand-600/15 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-600/30 hover:bg-brand-600/5 hover:shadow-md"
      >
        <p className="font-medium text-brand-900">Puntendashboard</p>
        <p className="text-sm text-zinc-600">Eerlijkheid per lid, dit schooljaar.</p>
      </Link>
    </div>
  );
}
