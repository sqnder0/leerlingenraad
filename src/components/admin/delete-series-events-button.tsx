"use client";

import { useState, useTransition } from "react";
import { deleteAllSeriesEvents } from "@/actions/admin/series";
import { SpinnerIcon } from "@/components/icons";

export function DeleteSeriesEventsButton({
  seriesId,
  seriesTitle,
}: {
  seriesId: string;
  seriesTitle: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (
      !window.confirm(
        `Alle events van "${seriesTitle}" definitief verwijderen (verleden en toekomst)? De reeks wordt ook gedeactiveerd. Dit kan niet ongedaan worden.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await deleteAllSeriesEvents(seriesId);
      } catch {
        setError("Verwijderen is mislukt, probeer opnieuw.");
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className="inline-flex items-center gap-1 text-red-600 underline underline-offset-2 disabled:pointer-events-none disabled:opacity-70"
      >
        {pending && <SpinnerIcon className="h-3.5 w-3.5" />}
        Verwijder alle events
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </span>
  );
}
