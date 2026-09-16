import { requireApprovedUser } from "@/lib/current-user";

// Placeholder for M2 — the real "upcoming events summary" lands in M3
// once events/RSVP exist (docs/plan.md §4).
export default async function DashboardPage() {
  const user = await requireApprovedUser();

  return (
    <div className="flex flex-1 flex-col gap-2 p-6">
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
        Welkom, {user.firstName}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Hier komt binnenkort een overzicht van komende events (M3).
      </p>
    </div>
  );
}
