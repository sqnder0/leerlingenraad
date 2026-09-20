import { prisma } from "@/lib/prisma";
import { createSeries } from "@/actions/admin/series";
import { SeriesForm } from "../series-form";

export default async function NewSeriesPage() {
  const members = await prisma.user.findMany({
    where: { status: "APPROVED" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold text-brand-900">Nieuw terugkerend event</h1>
        <SeriesForm
          action={createSeries}
          submitLabel="Aanmaken"
          members={members}
          defaultValues={{
            title: "",
            description: "",
            location: "",
            dayOfWeek: "3",
            startTime: "12:00",
            endTime: "13:00",
            pointValue: "1",
            membersNeeded: "1",
            weeksAhead: "4",
            assignmentMode: "ROTATION",
            inviteUserIds: [],
          }}
        />
      </div>
    </div>
  );
}
