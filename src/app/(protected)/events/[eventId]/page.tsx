import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { rsvp, declineAssignment } from "@/actions/member-actions";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await getCurrentUser();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      signups: {
        where: { response: "GOING" },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });
  if (!event || !user) notFound();

  const mySignup = await prisma.signup.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  const isRotationEvent = event.seriesId !== null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{event.title}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(event.startAt)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>

      {event.description && <p className="text-sm">{event.description}</p>}

      <div>
        <p className="mb-1 text-sm font-medium text-zinc-500">Aanwezig</p>
        {event.signups.length === 0 ? (
          <p className="text-sm text-zinc-500">Nog niemand.</p>
        ) : (
          <ul className="text-sm">
            {event.signups.map((s) => (
              <li key={s.id}>
                {s.user.firstName} {s.user.lastName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isRotationEvent ? (
        mySignup?.autoAssigned && mySignup.response === "GOING" ? (
          <form action={declineAssignment.bind(null, mySignup.id)}>
            <button
              type="submit"
              className="rounded border border-black/15 px-3 py-1.5 text-sm dark:border-white/15"
            >
              Ik kan niet
            </button>
          </form>
        ) : mySignup?.response === "NOT_GOING" ? (
          <p className="text-sm text-zinc-500">Je hebt afgemeld, iemand anders is toegewezen.</p>
        ) : null
      ) : (
        <div className="flex gap-3">
          <form action={rsvp.bind(null, event.id, "GOING")}>
            <button
              type="submit"
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                mySignup?.response === "GOING"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-black/15 dark:border-white/15"
              }`}
            >
              Ik kom
            </button>
          </form>
          <form action={rsvp.bind(null, event.id, "NOT_GOING")}>
            <button
              type="submit"
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                mySignup?.response === "NOT_GOING"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-black/15 dark:border-white/15"
              }`}
            >
              Ik kom niet
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
