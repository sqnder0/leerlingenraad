"use client";

import { useActionState } from "react";
import { createEvent, type EventFormState } from "@/actions/admin/events";

const initialState: EventFormState = { status: "idle" };

export default function NewEventPage() {
  const [state, formAction, isPending] = useActionState(createEvent, initialState);

  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold text-brand-900">Nieuw event</h1>

        <form action={formAction} className="flex flex-col gap-4">
          <Field label="Titel" name="title" required />
          <Field label="Beschrijving (optioneel)" name="description" textarea />
          <Field label="Locatie (optioneel)" name="location" />
          <Field label="Start" name="startAt" type="datetime-local" required />
          <Field label="Einde" name="endAt" type="datetime-local" required />
          <Field label="Punten" name="pointValue" type="number" defaultValue="1" required />

          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-sm text-zinc-600">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="DRAFT"
              className="rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="DRAFT">Concept</option>
              <option value="PUBLISHED">Gepubliceerd</option>
            </select>
          </div>

          {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Bezig…" : "Aanmaken"}
          </button>
        </form>
      </div>
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
    "rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm text-zinc-600">
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
