"use client";

import { useActionState } from "react";
import { authenticate } from "@/actions/auth";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <form
        action={formAction}
        className="flex w-full max-w-xs flex-col gap-4 rounded-lg border border-black/10 p-6 dark:border-white/10"
      >
        <h1 className="text-lg font-semibold text-black dark:text-zinc-50">Inloggen</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="username" className="text-sm text-zinc-600 dark:text-zinc-400">
            Gebruikersnaam
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="rounded border border-black/15 bg-white px-3 py-2 text-sm text-black dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50"
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
            className="rounded border border-black/15 bg-white px-3 py-2 text-sm text-black dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isPending ? "Bezig…" : "Inloggen"}
        </button>
      </form>
    </div>
  );
}
