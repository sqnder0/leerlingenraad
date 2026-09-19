"use client";

import { useActionState } from "react";
import { updateEvent, type EventFormState } from "@/actions/admin/events";

const initialState: EventFormState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30";

export function EditEventForm({
  eventId,
  defaultValues,
}: {
  eventId: string;
  defaultValues: {
    title: string;
    description: string;
    location: string;
    startAt: string;
    endAt: string;
    pointValue: string;
    status: string;
  };
}) {
  const action = updateEvent.bind(null, eventId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm text-zinc-600">
          Titel
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues.title}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm text-zinc-600">
          Beschrijving
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues.description}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm text-zinc-600">
          Locatie
        </label>
        <input
          id="location"
          name="location"
          defaultValue={defaultValues.location}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="startAt" className="text-sm text-zinc-600">
          Start
        </label>
        <input
          id="startAt"
          name="startAt"
          type="datetime-local"
          required
          defaultValue={defaultValues.startAt}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="endAt" className="text-sm text-zinc-600">
          Einde
        </label>
        <input
          id="endAt"
          name="endAt"
          type="datetime-local"
          required
          defaultValue={defaultValues.endAt}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="pointValue" className="text-sm text-zinc-600">
          Punten
        </label>
        <input
          id="pointValue"
          name="pointValue"
          type="number"
          required
          defaultValue={defaultValues.pointValue}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-sm text-zinc-600">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues.status}
          className={inputClass}
        >
          <option value="DRAFT">Concept</option>
          <option value="PUBLISHED">Gepubliceerd</option>
          <option value="CANCELLED">Geannuleerd</option>
          <option value="COMPLETED">Afgerond</option>
        </select>
      </div>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? "Bezig…" : "Opslaan"}
      </button>
    </form>
  );
}
