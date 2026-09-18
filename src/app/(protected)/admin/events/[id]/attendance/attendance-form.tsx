"use client";

import { useActionState } from "react";
import { submitAttendance, type AttendanceState } from "@/actions/admin/attendance";

const initialState: AttendanceState = { status: "idle" };

export function AttendanceForm({
  eventId,
  signups,
}: {
  eventId: string;
  signups: { id: string; name: string; attended: string; pointsAwarded: boolean }[];
}) {
  const action = submitAttendance.bind(null, eventId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-brand-600/10 dark:divide-brand-400/10">
        {signups.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2">
            <div>
              <input type="hidden" name="signupId" value={s.id} />
              <span>{s.name}</span>
              {s.pointsAwarded && (
                <span className="ml-2 text-xs text-zinc-500">(punten al toegekend)</span>
              )}
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`attended-${s.id}`}
                  value="PRESENT"
                  defaultChecked={s.attended === "PRESENT" || s.attended === "UNKNOWN"}
                />
                Aanwezig
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`attended-${s.id}`}
                  value="ABSENT"
                  defaultChecked={s.attended === "ABSENT"}
                />
                Afwezig
              </label>
            </div>
          </li>
        ))}
      </ul>

      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-brand-500 dark:text-white"
      >
        {isPending ? "Bezig…" : "Bevestigen en punten toekennen"}
      </button>
    </form>
  );
}
