import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { AgendaList, type AgendaEvent } from "@/components/agenda/agenda-list";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

export default async function EventsPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const events = await prisma.event.findMany({
    where: {
      status: { in: isAdmin ? ["DRAFT", "PUBLISHED", "COMPLETED"] : ["PUBLISHED", "COMPLETED"] },
    },
    orderBy: { startAt: "asc" },
    include: {
      signups: { where: { userId: user?.id }, select: { response: true, autoAssigned: true } },
    },
  });

  const items: AgendaEvent[] = events.map((event) => {
    const mySignup = event.signups[0];
    return {
      id: event.id,
      title: event.title,
      when: new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(event.startAt),
      location: event.location,
      isDraft: event.status === "DRAFT",
      assignedToMe: Boolean(mySignup?.autoAssigned && mySignup.response === "GOING"),
      mySignupResponse: mySignup && !mySignup.autoAssigned ? mySignup.response : null,
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-brand-900">Agenda</h1>
      <AgendaList events={items} isAdmin={isAdmin} />
    </div>
  );
}
