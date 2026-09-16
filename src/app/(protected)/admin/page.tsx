import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const pendingCount = await prisma.user.count({ where: { status: "PENDING" } });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Beheer</h1>

      <Link
        href="/admin/members"
        className="rounded border border-black/10 p-4 hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.05]"
      >
        <p className="font-medium text-black dark:text-zinc-50">Leden</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {pendingCount === 0
            ? "Geen aanvragen in afwachting."
            : `${pendingCount} account${pendingCount === 1 ? "" : "s"} wacht${pendingCount === 1 ? "" : "en"} op goedkeuring.`}
        </p>
      </Link>

      <p className="text-sm text-zinc-500">
        Events en de puntendashboard komen in latere milestones (M3/M4).
      </p>
    </div>
  );
}
