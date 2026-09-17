import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/current-user";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

export default async function MySignupsPage() {
  const user = await requireApprovedUser();

  const signups = await prisma.signup.findMany({
    where: { userId: user.id },
    include: { event: true },
    orderBy: { event: { startAt: "desc" } },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Mijn aanmeldingen</h1>

      {signups.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">Nog geen aanmeldingen of toewijzingen.</p>
      )}

      <ul className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
        {signups.map((s) => (
          <li key={s.id} className="py-3">
            <Link href={`/events/${s.eventId}`} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-black dark:text-zinc-50">{s.event.title}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(s.event.startAt)}
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {s.autoAssigned ? "Toegewezen" : "Zelf aangemeld"} ·{" "}
                {s.response === "GOING" ? "gaat door" : "afgemeld"}
                {s.attended !== "UNKNOWN" &&
                  ` · ${s.attended === "PRESENT" ? "aanwezig" : "afwezig"}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
