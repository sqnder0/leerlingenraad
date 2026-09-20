"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createInvite, type CreateInviteState } from "@/actions/admin/invites";
import { CopyInviteLink } from "@/components/admin/copy-invite-link";

const initialState: CreateInviteState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30";

export default function NewInvitePage() {
  const [state, formAction, isPending] = useActionState(createInvite, initialState);

  if (state.status === "success") {
    return (
      <div className="flex flex-1 flex-col items-center gap-4 p-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-4 text-xl font-semibold text-brand-900">Uitnodigingslink aangemaakt</h1>
          <p className="text-zinc-600">Deel deze link met de persoon die je wil uitnodigen.</p>
          <div className="mt-4">
            <CopyInviteLink code={state.code} />
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <Link href="/admin/invites" className="underline underline-offset-2">
              Naar het overzicht
            </Link>
            <Link href="/admin/invites/new" className="underline underline-offset-2">
              Nog een link aanmaken
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold text-brand-900">Nieuwe uitnodigingslink</h1>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="label" className="text-sm text-zinc-600">
              Label (optioneel)
            </label>
            <input
              id="label"
              name="label"
              placeholder="bv. 5A - september"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="expiresInDays" className="text-sm text-zinc-600">
              Geldig voor (dagen, optioneel)
            </label>
            <input
              id="expiresInDays"
              name="expiresInDays"
              type="number"
              min={1}
              placeholder="bv. 14"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="maxUses" className="text-sm text-zinc-600">
              Maximaal aantal keer bruikbaar (optioneel)
            </label>
            <input
              id="maxUses"
              name="maxUses"
              type="number"
              min={1}
              placeholder="onbeperkt"
              className={inputClass}
            />
          </div>

          {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Bezig…" : "Aanmaken"}
          </button>
        </form>
      </div>
    </div>
  );
}
