"use client";

import { useActionState } from "react";
import { createEvent, type EventFormState } from "@/actions/admin/events";

const initialState: EventFormState = { status: "idle" };

export default function NewEventPage() {
  const [state, formAction, isPending] = useActionState(createEvent, initialState);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Nieuw event</h1>

      <form action={formAction} className="flex max-w-sm flex-col gap-4">
        <Field label="Titel" name="title" required />
        <Field label="Beschrijving (optioneel)" name="description" textarea />
        <Field label="Locatie (optioneel)" name="location" />
        <Field label="Start" name="startAt" type="datetime-local" required />
        <Field label="Einde" name="endAt" type="datetime-local" required />
        <Field label="Punten" name="pointValue" type="number" defaultValue="1" required />

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm text-zinc-600 dark:text-zinc-400">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="DRAFT"
            className="rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          >
            <option value="DRAFT">Concept</option>
            <option value="PUBLISHED">Gepubliceerd</option>
          </select>
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

function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  defaultValue?: string;
}) {
  const className =
    "rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      {textarea ? (
        <textarea id={name} name={name} className={className} rows={3} />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className={className}
        />
      )}
    </div>
  );
}
