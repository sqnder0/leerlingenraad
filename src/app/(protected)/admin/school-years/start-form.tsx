"use client";

import { useActionState } from "react";
import { startNewSchoolYear, type StartSchoolYearState } from "@/actions/admin/school-years";

const initialState: StartSchoolYearState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-brand-400/25 dark:bg-brand-950";

function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function StartSchoolYearForm({ defaultStartsAt }: { defaultStartsAt?: Date }) {
  const [state, formAction, isPending] = useActionState(startNewSchoolYear, initialState);

  const startDefault = defaultStartsAt
    ? toDateInputValue(new Date(defaultStartsAt.getTime() + 24 * 60 * 60 * 1000))
    : undefined;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="label" className="text-sm text-zinc-600 dark:text-zinc-400">
          Naam
        </label>
        <input
          id="label"
          name="label"
          placeholder="bv. 2026-2027"
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="startsAt" className="text-sm text-zinc-600 dark:text-zinc-400">
          Start
        </label>
        <input
          id="startsAt"
          name="startsAt"
          type="date"
          required
          defaultValue={startDefault}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="endsAt" className="text-sm text-zinc-600 dark:text-zinc-400">
          Einde
        </label>
        <input id="endsAt" name="endsAt" type="date" required className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:pointer-events-none disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
      >
        {isPending ? "Bezig…" : "Archiveer & start"}
      </button>
      {state.status === "error" && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
    </form>
  );
}
