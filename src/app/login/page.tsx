"use client";

import { useActionState } from "react";
import { authenticate } from "@/actions/auth";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6 dark:from-brand-950 dark:via-brand-900 dark:to-brand-950">
      <form
        action={formAction}
        className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-brand-600/15 bg-white p-8 shadow-xl shadow-brand-900/5 dark:border-brand-400/15 dark:bg-brand-950/60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline brand mark, not worth next/image's overhead */}
        <img src="/icon.svg" alt="" width={40} height={40} className="mx-auto" />
        <h1 className="text-center text-lg font-semibold text-brand-900 dark:text-brand-50">
          Inloggen
        </h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="username" className="text-sm text-zinc-600 dark:text-zinc-400">
            Gebruikersnaam
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-brand-400/25 dark:bg-brand-950 dark:text-brand-50"
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
            className="rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-brand-400/25 dark:bg-brand-950 dark:text-brand-50"
          />
        </div>

        {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:pointer-events-none disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          {isPending ? "Bezig…" : "Inloggen"}
        </button>
      </form>
    </div>
  );
}
