"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { rsvp } from "@/actions/member-actions";
import { useConfirmFlash } from "@/hooks/use-confirm-flash";
import { SpinnerIcon, CheckIcon } from "@/components/icons";

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
  const [, startTransition] = useTransition();
  const { pendingKey, setPendingKey, confirmedKey, confirm } = useConfirmFlash();

  function respond(eventId: string, response: "GOING" | "NOT_GOING") {
    const key = `${eventId}:${response}`;
    setPendingKey(key);
    startTransition(async () => {
      setResponse({ id: eventId, response });
      await rsvp(eventId, response);
      confirm(key);
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-600">Nog geen events gepland.</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((event) => {
        const goingKey = `${event.id}:GOING`;
        const notGoingKey = `${event.id}:NOT_GOING`;
        return (
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
                disabled={pendingKey === goingKey}
                onClick={() => respond(event.id, "GOING")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-70 ${
                  event.response === "GOING"
                    ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                    : "border border-brand-600/30 hover:bg-brand-600/5"
                }`}
              >
                {pendingKey === goingKey && <SpinnerIcon className="h-3.5 w-3.5" />}
                {confirmedKey === goingKey && <CheckIcon className="h-3.5 w-3.5" />}
                Ik kom
              </button>
              <button
                type="button"
                disabled={pendingKey === notGoingKey}
                onClick={() => respond(event.id, "NOT_GOING")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-70 ${
                  event.response === "NOT_GOING"
                    ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                    : "border border-brand-600/30 hover:bg-brand-600/5"
                }`}
              >
                {pendingKey === notGoingKey && <SpinnerIcon className="h-3.5 w-3.5" />}
                {confirmedKey === notGoingKey && <CheckIcon className="h-3.5 w-3.5" />}
                Ik kom niet
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
