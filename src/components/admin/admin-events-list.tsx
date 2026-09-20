"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { deleteEvent } from "@/actions/admin/events";
import { deleteAllSeriesEvents } from "@/actions/admin/series";
import { SpinnerIcon } from "@/components/icons";

export type AdminEventRow = {
  id: string;
  title: string;
  seriesId: string | null;
  seriesTitle: string | null;
  when: string;
  status: string;
  pointValue: number;
};

type RemoveAction = { type: "one"; id: string } | { type: "series"; seriesId: string };

export function AdminEventsList({ events }: { events: AdminEventRow[] }) {
  const [items, removeItem] = useOptimistic(events, (state, action: RemoveAction) =>
    action.type === "one"
      ? state.filter((e) => e.id !== action.id)
      : state.filter((e) => e.seriesId !== action.seriesId),
  );
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function remove(event: AdminEventRow) {
    if (!window.confirm(`"${event.title}" definitief verwijderen? Dit kan niet ongedaan worden.`)) {
      return;
    }
    setError(null);
    setPendingId(event.id);
    startTransition(async () => {
      try {
        await deleteEvent(event.id);
        removeItem({ type: "one", id: event.id });
      } catch {
        setError("Verwijderen is mislukt, probeer opnieuw.");
      } finally {
        setPendingId(null);
      }
    });
  }

  function removeSeries(event: AdminEventRow) {
    if (!event.seriesId) return;
    if (
      !window.confirm(
        `Alle events van "${event.seriesTitle}" definitief verwijderen (verleden en toekomst)? De reeks wordt ook gedeactiveerd. Dit kan niet ongedaan worden.`,
      )
    ) {
      return;
    }
    setError(null);
    setPendingId(event.id);
    const seriesId = event.seriesId;
    startTransition(async () => {
      try {
        await deleteAllSeriesEvents(seriesId);
        removeItem({ type: "series", seriesId });
      } catch {
        setError("Verwijderen is mislukt, probeer opnieuw.");
      } finally {
        setPendingId(null);
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">Geen events in dit schooljaar.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-600/15 text-zinc-500">
              <th className="py-2 pr-4">Titel</th>
              <th className="py-2 pr-4">Wanneer</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Punten</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {items.map((event) => (
              <tr
                key={event.id}
                className="border-b border-brand-600/10 transition-colors hover:bg-brand-600/5"
              >
                <td className="py-2 pr-4">
                  {event.title}
                  {event.seriesTitle && (
                    <span className="ml-2 text-xs text-zinc-500">({event.seriesTitle})</span>
                  )}
                </td>
                <td className="py-2 pr-4">{event.when}</td>
                <td className="py-2 pr-4">{event.status}</td>
                <td className="py-2 pr-4">{event.pointValue}</td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="underline underline-offset-2"
                  >
                    Bewerken
                  </Link>
                  {event.status !== "DRAFT" && event.status !== "CANCELLED" && (
                    <Link
                      href={`/admin/events/${event.id}/attendance`}
                      className="ml-3 underline underline-offset-2"
                    >
                      Aanwezigheid
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={pendingId === event.id}
                    onClick={() => remove(event)}
                    className="ml-3 inline-flex items-center gap-1 text-red-600 underline underline-offset-2 disabled:pointer-events-none disabled:opacity-70"
                  >
                    {pendingId === event.id && <SpinnerIcon className="h-3.5 w-3.5" />}
                    Verwijderen
                  </button>
                  {event.seriesId && (
                    <button
                      type="button"
                      disabled={pendingId === event.id}
                      onClick={() => removeSeries(event)}
                      className="ml-3 inline-flex items-center gap-1 text-red-600 underline underline-offset-2 disabled:pointer-events-none disabled:opacity-70"
                    >
                      Verwijder hele reeks
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
