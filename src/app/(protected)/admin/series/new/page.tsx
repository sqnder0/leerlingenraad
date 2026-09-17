"use client";

import { useActionState } from "react";
import { createSeries, type SeriesFormState } from "@/actions/admin/series";

const initialState: SeriesFormState = { status: "idle" };
const inputClass =
  "rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900";
const DAYS = [
  { value: 0, label: "zondag" },
  { value: 1, label: "maandag" },
  { value: 2, label: "dinsdag" },
  { value: 3, label: "woensdag" },
  { value: 4, label: "donderdag" },
  { value: 5, label: "vrijdag" },
  { value: 6, label: "zaterdag" },
];

export default function NewSeriesPage() {
  const [state, formAction, isPending] = useActionState(createSeries, initialState);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
        Nieuw terugkerend event
      </h1>

      <form action={formAction} className="flex max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm text-zinc-600 dark:text-zinc-400">
            Titel
          </label>
          <input id="title" name="title" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm text-zinc-600 dark:text-zinc-400">
            Beschrijving (optioneel)
          </label>
          <textarea id="description" name="description" rows={2} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="location" className="text-sm text-zinc-600 dark:text-zinc-400">
            Locatie (optioneel)
          </label>
          <input id="location" name="location" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dayOfWeek" className="text-sm text-zinc-600 dark:text-zinc-400">
            Dag van de week
          </label>
          <select id="dayOfWeek" name="dayOfWeek" defaultValue="3" className={inputClass}>
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="startTime" className="text-sm text-zinc-600 dark:text-zinc-400">
              Start
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue="12:00"
              className={inputClass}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="endTime" className="text-sm text-zinc-600 dark:text-zinc-400">
              Einde
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue="13:00"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="membersNeeded" className="text-sm text-zinc-600 dark:text-zinc-400">
              Personen nodig
            </label>
            <input
              id="membersNeeded"
              name="membersNeeded"
              type="number"
              min={1}
              defaultValue="1"
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="pointValue" className="text-sm text-zinc-600 dark:text-zinc-400">
              Punten
            </label>
            <input
              id="pointValue"
              name="pointValue"
              type="number"
              min={0}
              defaultValue="1"
              required
              className={inputClass}
            />
          </div>
        </div>

        {state.status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isPending ? "Bezig…" : "Aanmaken"}
        </button>
      </form>
    </div>
  );
}
