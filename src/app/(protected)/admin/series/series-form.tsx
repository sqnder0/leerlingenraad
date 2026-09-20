"use client";

import { useActionState, useState } from "react";
import type { SeriesFormState } from "@/actions/admin/series";

const inputClass =
  "rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30";
const DAYS = [
  { value: 0, label: "zondag" },
  { value: 1, label: "maandag" },
  { value: 2, label: "dinsdag" },
  { value: 3, label: "woensdag" },
  { value: 4, label: "donderdag" },
  { value: 5, label: "vrijdag" },
  { value: 6, label: "zaterdag" },
];
const MODES = [
  { value: "ROTATION", label: "Rotatie", hint: "Eerlijk verdeeld over de groep, per beurt." },
  {
    value: "EVERYONE",
    label: "Iedereen",
    hint: "Elk goedgekeurd lid wordt elke keer uitgenodigd.",
  },
  {
    value: "SPECIFIC",
    label: "Specifieke personen",
    hint: "Jij kiest wie elke keer uitgenodigd wordt.",
  },
] as const;

type Member = { id: string; firstName: string; lastName: string };

export type SeriesFormValues = {
  title: string;
  description: string;
  location: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  pointValue: string;
  membersNeeded: string;
  weeksAhead: string;
  assignmentMode: "ROTATION" | "EVERYONE" | "SPECIFIC";
  inviteUserIds: string[];
};

export function SeriesForm({
  action,
  submitLabel,
  defaultValues,
  members,
}: {
  action: (state: SeriesFormState, formData: FormData) => Promise<SeriesFormState>;
  submitLabel: string;
  defaultValues: SeriesFormValues;
  members: Member[];
}) {
  const [state, formAction, isPending] = useActionState<SeriesFormState, FormData>(action, {
    status: "idle",
  });
  const [mode, setMode] = useState(defaultValues.assignmentMode);
  const [invited, setInvited] = useState(new Set(defaultValues.inviteUserIds));

  function toggleInvited(userId: string) {
    setInvited((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

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
          Beschrijving (optioneel)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={defaultValues.description}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm text-zinc-600">
          Locatie (optioneel)
        </label>
        <input
          id="location"
          name="location"
          defaultValue={defaultValues.location}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="dayOfWeek" className="text-sm text-zinc-600">
          Dag van de week
        </label>
        <select
          id="dayOfWeek"
          name="dayOfWeek"
          defaultValue={defaultValues.dayOfWeek}
          className={inputClass}
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="startTime" className="text-sm text-zinc-600">
            Start
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            required
            defaultValue={defaultValues.startTime}
            className={inputClass}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="endTime" className="text-sm text-zinc-600">
            Einde
          </label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            required
            defaultValue={defaultValues.endTime}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="pointValue" className="text-sm text-zinc-600">
          Punten
        </label>
        <input
          id="pointValue"
          name="pointValue"
          type="number"
          min={0}
          defaultValue={defaultValues.pointValue}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="weeksAhead" className="text-sm text-zinc-600">
          Weken vooruit genereren
        </label>
        <input
          id="weeksAhead"
          name="weeksAhead"
          type="number"
          min={1}
          max={52}
          defaultValue={defaultValues.weeksAhead}
          required
          className={inputClass}
        />
        <p className="text-xs text-zinc-500">
          Het rooster wordt automatisch aangevuld zodat er altijd zoveel weken vooruit gepland
          staat.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-zinc-600">Wie wordt uitgenodigd?</legend>
        {MODES.map((m) => (
          <label
            key={m.value}
            className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              mode === m.value
                ? "border-brand-600 bg-brand-600/5"
                : "border-brand-600/20 hover:bg-brand-600/5"
            }`}
          >
            <span className="flex items-center gap-2 font-medium text-brand-900">
              <input
                type="radio"
                name="assignmentMode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
              />
              {m.label}
            </span>
            <span className="pl-5 text-xs text-zinc-500">{m.hint}</span>
          </label>
        ))}
      </fieldset>

      {mode === "ROTATION" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="membersNeeded" className="text-sm text-zinc-600">
            Personen nodig per beurt
          </label>
          <input
            id="membersNeeded"
            name="membersNeeded"
            type="number"
            min={1}
            defaultValue={defaultValues.membersNeeded}
            required
            className={inputClass}
          />
        </div>
      )}

      {mode === "SPECIFIC" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm text-zinc-600">Genodigden</legend>
          <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-brand-600/20 p-2">
            {members.length === 0 ? (
              <p className="text-sm text-zinc-500">Geen goedgekeurde leden.</p>
            ) : (
              members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm transition-colors hover:bg-brand-600/5"
                >
                  <input
                    type="checkbox"
                    name="inviteUserIds"
                    value={member.id}
                    checked={invited.has(member.id)}
                    onChange={() => toggleInvited(member.id)}
                  />
                  {member.firstName} {member.lastName}
                </label>
              ))
            )}
          </div>
        </fieldset>
      )}

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? "Bezig…" : submitLabel}
      </button>
    </form>
  );
}
