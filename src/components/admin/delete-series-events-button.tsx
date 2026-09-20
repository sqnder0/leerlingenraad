"use client";

import { useState, useTransition } from "react";
import { deleteAllSeriesEvents, deleteSeries } from "@/actions/admin/series";
import { SpinnerIcon } from "@/components/icons";

function ConfirmDeleteButton({
  label,
  confirmMessage,
  onConfirm,
}: {
  label: string;
  confirmMessage: string;
  onConfirm: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      try {
        await onConfirm();
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
        {label}
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </span>
  );
}

/** Deletes every event this series generated, keeps the (now deactivated) series template. */
export function DeleteSeriesEventsButton({
  seriesId,
  seriesTitle,
}: {
  seriesId: string;
  seriesTitle: string;
}) {
  return (
    <ConfirmDeleteButton
      label="Verwijder alle events"
      confirmMessage={`Alle events van "${seriesTitle}" definitief verwijderen (verleden en toekomst)? De reeks wordt ook gedeactiveerd. Dit kan niet ongedaan worden.`}
      onConfirm={() => deleteAllSeriesEvents(seriesId)}
    />
  );
}

/** Deletes just the series template, leaving its already-generated events in place as standalone events. */
export function DeleteSeriesButton({
  seriesId,
  seriesTitle,
}: {
  seriesId: string;
  seriesTitle: string;
}) {
  return (
    <ConfirmDeleteButton
      label="Verwijder reeks"
      confirmMessage={`De reeks "${seriesTitle}" zelf definitief verwijderen? Er worden geen nieuwe events meer voor gegenereerd, maar reeds gegenereerde events blijven gewoon bestaan als losse events. Dit kan niet ongedaan worden.`}
      onConfirm={() => deleteSeries(seriesId)}
    />
  );
}
