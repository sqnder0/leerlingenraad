"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { rsvp } from "@/actions/member-actions";

export type OptInEvent = {
  id: string;
  title: string;
  when: string;
  response: "GOING" | "NOT_GOING" | null;
};

export function OptInList({ events }: { events: OptInEvent[] }) {
  const [items, setResponse] = useOptimistic(
    events,
    (state, update: { id: string; response: "GOING" | "NOT_GOING" }) =>
      state.map((e) => (e.id === update.id ? { ...e, response: update.response } : e)),
  );
  const [isPending, startTransition] = useTransition();

  function respond(eventId: string, response: "GOING" | "NOT_GOING") {
    startTransition(async () => {
      setResponse({ id: eventId, response });
      await rsvp(eventId, response);
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-600">Nog geen events gepland.</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((event) => (
        <li
          key={event.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-brand-600/10 px-3 py-2 transition-colors hover:border-brand-600/25 hover:bg-brand-600/5"
        >
          <Link href={`/events/${event.id}`} className="flex-1">
            <p className="font-medium text-brand-900">{event.title}</p>
            <p className="text-sm text-zinc-500">{event.when}</p>
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => respond(event.id, "GOING")}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                event.response === "GOING"
                  ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                  : "border border-brand-600/30 hover:bg-brand-600/5"
              }`}
            >
              Ik kom
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => respond(event.id, "NOT_GOING")}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                event.response === "NOT_GOING"
                  ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                  : "border border-brand-600/30 hover:bg-brand-600/5"
              }`}
            >
              Ik kom niet
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
