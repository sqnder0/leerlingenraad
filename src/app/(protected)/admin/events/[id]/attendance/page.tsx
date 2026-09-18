import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AttendanceForm } from "./attendance-form";

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      signups: {
        where: { response: "GOING" },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { user: { lastName: "asc" } },
      },
    },
  });
  if (!event) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">
          Aanwezigheid: {event.title}
        </h1>
        <p className="text-sm text-zinc-500">
          {new Intl.DateTimeFormat("nl-BE", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          }).format(event.startAt)}{" "}
          · {event.pointValue} punt{event.pointValue === 1 ? "" : "en"} per aanwezige
          {event.status === "COMPLETED" && " · al afgerond"}
        </p>
      </div>

      {event.signups.length === 0 ? (
        <p className="text-sm text-zinc-500">Niemand had zich aangemeld.</p>
      ) : (
        <AttendanceForm
          eventId={event.id}
          signups={event.signups.map((s) => ({
            id: s.id,
            name: `${s.user.firstName} ${s.user.lastName}`,
            attended: s.attended,
            pointsAwarded: s.pointsAwarded,
          }))}
        />
      )}
    </div>
  );
}
