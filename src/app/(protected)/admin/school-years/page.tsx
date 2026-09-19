import { prisma } from "@/lib/prisma";
import { StartSchoolYearForm } from "./start-form";

export default async function SchoolYearsPage() {
  const schoolYears = await prisma.schoolYear.findMany({ orderBy: { startsAt: "desc" } });
  const active = schoolYears.find((y) => y.isActive);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold text-brand-900">Schooljaren</h1>

      <ul className="flex flex-col gap-1.5">
        {schoolYears.map((y) => (
          <li
            key={y.id}
            className="flex items-center justify-between rounded-lg border border-brand-600/10 px-3 py-2 text-sm"
          >
            <span>{y.label}</span>
            <span className="text-zinc-500">
              {new Intl.DateTimeFormat("nl-BE").format(y.startsAt)} –{" "}
              {new Intl.DateTimeFormat("nl-BE").format(y.endsAt)}
              {y.isActive && (
                <span className="ml-2 rounded-full bg-brand-600/10 px-2.5 py-0.5 text-xs font-medium text-brand-800">
                  actief
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-brand-600/15 bg-brand-50/50 p-4">
        <p className="mb-1 font-medium text-brand-900">Archiveer huidig & start nieuw schooljaar</p>
        <p className="mb-4 text-sm text-zinc-600">
          {active ? (
            <>
              <strong>{active.label}</strong> wordt gearchiveerd (alle data blijft bewaard, enkel
              read-only). Het nieuwe schooljaar wordt meteen het actieve.
            </>
          ) : (
            "Er is nog geen actief schooljaar."
          )}
        </p>
        <StartSchoolYearForm defaultStartsAt={active ? active.endsAt : undefined} />
      </div>
    </div>
  );
}
