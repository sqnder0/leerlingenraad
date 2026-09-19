"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { publishEvent } from "@/actions/admin/events";
import { SendIcon } from "@/components/icons";

export type AgendaEvent = {
  id: string;
  title: string;
  when: string;
  location: string | null;
  isDraft: boolean;
  assignedToMe: boolean;
  mySignupResponse: "GOING" | "NOT_GOING" | null;
};

export function AgendaList({ events, isAdmin }: { events: AgendaEvent[]; isAdmin: boolean }) {
  const [items, markPublished] = useOptimistic(events, (state, eventId: string) =>
    state.map((e) => (e.id === eventId ? { ...e, isDraft: false } : e)),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function publish(eventId: string) {
    setError(null);
    startTransition(async () => {
      markPublished(eventId);
      try {
        await publishEvent(eventId);
      } catch {
        setError("Publiceren is mislukt, probeer opnieuw.");
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-zinc-600">Nog geen events gepland.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="flex flex-col gap-1.5">
        {items.map((event) => (
          <li
            key={event.id}
            className={`flex flex-col gap-2 rounded-lg border px-3 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
              event.isDraft
                ? "border-amber-400/40 bg-amber-50/60 hover:border-amber-400/70"
                : "border-brand-600/10 hover:border-brand-600/25 hover:bg-brand-600/5"
            }`}
          >
            <Link href={`/events/${event.id}`} className="flex flex-1 flex-col gap-1">
              <span className="flex items-center gap-2">
                <span className="font-medium text-brand-900">{event.title}</span>
                {event.isDraft && (
                  <span className="rounded-full bg-amber-400/25 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                    Concept
                  </span>
                )}
                {event.assignedToMe && (
                  <span className="rounded-full bg-brand-600/10 px-2.5 py-1 text-xs font-medium text-brand-800">
                    Toegewezen
                  </span>
                )}
                {event.mySignupResponse && !event.assignedToMe && (
                  <span className="text-xs text-zinc-500">
                    {event.mySignupResponse === "GOING" ? "Aangemeld" : "Afgemeld"}
                  </span>
                )}
              </span>
              <span className="text-sm text-zinc-600">
                {event.when}
                {event.location ? ` · ${event.location}` : ""}
              </span>
            </Link>

            {isAdmin && event.isDraft && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => publish(event.id)}
                className="flex w-fit items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50"
              >
                <SendIcon className="h-3.5 w-3.5" />
                Publiceren
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
