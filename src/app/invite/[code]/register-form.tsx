"use client";

import { useActionState, useState } from "react";
import { registerViaInvite, type RegisterState } from "@/actions/register";

const initialState: RegisterState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30";

export function RegisterForm({ code }: { code: string }) {
  const [state, formAction, isPending] = useActionState(
    registerViaInvite.bind(null, code),
    initialState,
  );
  const [isTeacher, setIsTeacher] = useState(false);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-brand-600/15 bg-white p-8 shadow-xl shadow-brand-900/5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline brand mark, not worth next/image's overhead */}
      <img src="/icon.svg" alt="" width={40} height={40} className="mx-auto" />
      <h1 className="text-center text-lg font-semibold text-brand-900">Account aanmaken</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="firstName" className="text-sm text-zinc-600">
          Voornaam
        </label>
        <input id="firstName" name="firstName" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lastName" className="text-sm text-zinc-600">
          Achternaam
        </label>
        <input id="lastName" name="lastName" required className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          name="isTeacher"
          checked={isTeacher}
          onChange={(e) => setIsTeacher(e.target.checked)}
        />
        Ik ben leerkracht
      </label>

      {!isTeacher && (
        <div className="flex flex-col gap-1">
          <label htmlFor="classGroup" className="text-sm text-zinc-600">
            Klas (optioneel)
          </label>
          <input id="classGroup" name="classGroup" placeholder="bv. 5A" className={inputClass} />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-zinc-600">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm text-zinc-600">
          Wachtwoord bevestigen
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? "Bezig…" : "Account aanmaken"}
      </button>
    </form>
  );
}
