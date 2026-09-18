"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTrimester, type TrimesterFormState } from "@/actions/admin/trimesters";

const initialState: TrimesterFormState = { status: "idle" };
const inputClass =
  "rounded border border-brand-600/25 bg-white px-3 py-2 text-sm dark:border-brand-400/25 dark:bg-brand-950";

export default function NewTrimesterPage() {
  const [state, formAction, isPending] = useActionState(createTrimester, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.push(`/admin/trimesters/${state.trimesterId}`);
    }
  }, [state, router]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">Nieuw trimester</h1>

      <form action={formAction} className="flex max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="label" className="text-sm text-zinc-600 dark:text-zinc-400">
            Naam
          </label>
          <input
            id="label"
            name="label"
            placeholder="bv. Trimester 1"
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="startsAt" className="text-sm text-zinc-600 dark:text-zinc-400">
            Start
          </label>
          <input id="startsAt" name="startsAt" type="date" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="endsAt" className="text-sm text-zinc-600 dark:text-zinc-400">
            Einde
          </label>
          <input id="endsAt" name="endsAt" type="date" required className={inputClass} />
        </div>

        {state.status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-brand-500 dark:text-white"
        >
          {isPending ? "Bezig…" : "Aanmaken"}
        </button>
      </form>
    </div>
  );
}
