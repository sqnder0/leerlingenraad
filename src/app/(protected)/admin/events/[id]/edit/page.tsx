import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditEventForm } from "./edit-form";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-brand-900">Event bewerken</h1>
      <EditEventForm
        eventId={event.id}
        defaultValues={{
          title: event.title,
          description: event.description ?? "",
          location: event.location ?? "",
          startAt: toLocalInputValue(event.startAt),
          endAt: toLocalInputValue(event.endAt),
          pointValue: String(event.pointValue),
          status: event.status,
        }}
      />
    </div>
  );
}
