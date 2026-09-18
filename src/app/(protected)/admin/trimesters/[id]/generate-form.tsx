"use client";

import { useActionState } from "react";
import { generateRoster, type GenerateRosterState } from "@/actions/admin/trimesters";

const initialState: GenerateRosterState = { status: "idle" };

export function GenerateRosterForm({
  trimesterId,
  series,
}: {
  trimesterId: string;
  series: { id: string; title: string }[];
}) {
  const action = generateRoster.bind(null, trimesterId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (series.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Geen actieve terugkerende events. Maak er eerst een aan onder Terugkerende events.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="seriesId" className="text-sm text-zinc-600 dark:text-zinc-400">
          Genereer rooster voor
        </label>
        <select
          id="seriesId"
          name="seriesId"
          className="rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-brand-400/25 dark:bg-brand-950"
        >
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:pointer-events-none disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
      >
        {isPending ? "Bezig…" : "Genereer"}
      </button>
      {state.status === "success" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {state.occurrencesCreated} van {state.totalOccurrences} beurten aangemaakt (rest bestond
          al).
        </p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
    </form>
  );
}
