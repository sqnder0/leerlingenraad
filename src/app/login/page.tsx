"use client";

import { useActionState } from "react";
import { authenticate } from "@/actions/auth";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-50 dark:bg-brand-950">
      <form
        action={formAction}
        className="flex w-full max-w-xs flex-col gap-4 rounded-lg border border-brand-600/15 p-6 dark:border-brand-400/15"
      >
        <h1 className="text-lg font-semibold text-brand-900 dark:text-brand-50">Inloggen</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="username" className="text-sm text-zinc-600 dark:text-zinc-400">
            Gebruikersnaam
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="rounded border border-brand-600/25 bg-white px-3 py-2 text-sm text-brand-900 dark:border-brand-400/25 dark:bg-brand-950 dark:text-brand-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-zinc-600 dark:text-zinc-400">
            Wachtwoord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded border border-brand-600/25 bg-white px-3 py-2 text-sm text-brand-900 dark:border-brand-400/25 dark:bg-brand-950 dark:text-brand-50"
          />
        </div>

        {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-brand-500 dark:text-white"
        >
          {isPending ? "Bezig…" : "Inloggen"}
        </button>
      </form>
    </div>
  );
}
