import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSeries } from "@/actions/admin/series";
import { SeriesForm } from "../../series-form";

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [series, members] = await Promise.all([
    prisma.recurringSeries.findUnique({
      where: { id },
      include: { invitedMembers: { select: { userId: true } } },
    }),
    prisma.user.findMany({
      where: { status: "APPROVED" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);
  if (!series) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold text-brand-900">Terugkerend event bewerken</h1>
        <SeriesForm
          action={updateSeries.bind(null, series.id)}
          submitLabel="Opslaan"
          members={members}
          defaultValues={{
            title: series.title,
            description: series.description ?? "",
            location: series.location ?? "",
            dayOfWeek: String(series.dayOfWeek),
            startTime: series.startTime,
            endTime: series.endTime,
            pointValue: String(series.pointValue),
            membersNeeded: String(series.membersNeeded),
            weeksAhead: String(series.weeksAhead),
            assignmentMode: series.assignmentMode,
            inviteUserIds: series.invitedMembers.map((m) => m.userId),
          }}
        />
      </div>
    </div>
  );
}
