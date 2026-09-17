"use client";

import { useActionState } from "react";
import { createManualAdjustment, type AdjustmentState } from "@/actions/admin/points";

const initialState: AdjustmentState = { status: "idle" };
const inputClass =
  "rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900";

export function AdjustmentForm({ userId }: { userId: string }) {
  const action = createManualAdjustment.bind(null, userId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="delta" className="text-sm text-zinc-600 dark:text-zinc-400">
          Aanpassing (+/-)
        </label>
        <input
          id="delta"
          name="delta"
          type="number"
          required
          placeholder="bv. -2 of 3"
          className={`${inputClass} w-28`}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="reason" className="text-sm text-zinc-600 dark:text-zinc-400">
          Reden
        </label>
        <input id="reason" name="reason" required className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {isPending ? "Bezig…" : "Toepassen"}
      </button>
      {state.status === "error" && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
    </form>
  );
}
