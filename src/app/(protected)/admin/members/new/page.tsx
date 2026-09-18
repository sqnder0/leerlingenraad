"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createMember, type CreateMemberState } from "@/actions/admin/members";

const initialState: CreateMemberState = { status: "idle" };

export default function NewMemberPage() {
  const [state, formAction, isPending] = useActionState(createMember, initialState);

  if (state.status === "success") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">Lid aangemaakt</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Geef deze inloggegevens door aan het lid, ze worden hierna niet meer getoond. Het account
          staat nog op <strong>PENDING</strong> tot je het goedkeurt op de ledenlijst.
        </p>
        <dl className="w-fit rounded border border-brand-600/15 p-4 text-sm dark:border-brand-400/15">
          <dt className="text-zinc-500">Gebruikersnaam</dt>
          <dd className="mb-2 font-mono">{state.username}</dd>
          <dt className="text-zinc-500">Wachtwoord</dt>
          <dd className="font-mono">{state.password}</dd>
        </dl>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/members" className="underline underline-offset-2">
            Naar de ledenlijst
          </Link>
          <Link href="/admin/members/new" className="underline underline-offset-2">
            Nog een lid toevoegen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">Nieuw lid</h1>

      <form action={formAction} className="flex max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="firstName" className="text-sm text-zinc-600 dark:text-zinc-400">
            Voornaam
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            className="rounded border border-brand-600/25 bg-white px-3 py-2 text-sm dark:border-brand-400/25 dark:bg-brand-950"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="lastName" className="text-sm text-zinc-600 dark:text-zinc-400">
            Achternaam
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            className="rounded border border-brand-600/25 bg-white px-3 py-2 text-sm dark:border-brand-400/25 dark:bg-brand-950"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="classGroup" className="text-sm text-zinc-600 dark:text-zinc-400">
            Klas (optioneel)
          </label>
          <input
            id="classGroup"
            name="classGroup"
            placeholder="bv. 5A"
            className="rounded border border-brand-600/25 bg-white px-3 py-2 text-sm dark:border-brand-400/25 dark:bg-brand-950"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm text-zinc-600 dark:text-zinc-400">
            Rol
          </label>
          <select
            id="role"
            name="role"
            defaultValue="MEMBER"
            className="rounded border border-brand-600/25 bg-white px-3 py-2 text-sm dark:border-brand-400/25 dark:bg-brand-950"
          >
            <option value="MEMBER">Lid</option>
            <option value="ADMIN">Beheerder</option>
          </select>
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
