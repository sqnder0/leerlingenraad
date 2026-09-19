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
      <h1 className="text-xl font-semibold text-brand-900">Mijn aanmeldingen</h1>

      {signups.length === 0 && (
        <p className="text-zinc-600">Nog geen aanmeldingen of toewijzingen.</p>
      )}

      <ul className="flex flex-col gap-1.5">
        {signups.map((s) => (
          <li key={s.id}>
            <Link
              href={`/events/${s.eventId}`}
              className="flex flex-col gap-1 rounded-lg border border-brand-600/10 px-3 py-3 transition-colors hover:border-brand-600/25 hover:bg-brand-600/5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-brand-900">{s.event.title}</p>
                <p className="text-sm text-zinc-600">
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
