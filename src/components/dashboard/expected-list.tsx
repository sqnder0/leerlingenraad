"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { declineAssignment } from "@/actions/member-actions";

export type ExpectedSignup = {
  id: string;
  eventId: string;
  title: string;
  when: string;
};

export function ExpectedList({ signups }: { signups: ExpectedSignup[] }) {
  const [items, removeItem] = useOptimistic(signups, (state, id: string) =>
    state.filter((s) => s.id !== id),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decline(signupId: string) {
    setError(null);
    startTransition(async () => {
      removeItem(signupId);
      try {
        await declineAssignment(signupId);
      } catch {
        setError("Afmelden is mislukt, probeer opnieuw.");
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-600">Geen toegewezen beurten gepland.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="flex flex-col gap-1.5">
        {items.map((signup) => (
          <li
            key={signup.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-brand-600/10 px-3 py-2 transition-colors hover:border-brand-600/25 hover:bg-brand-600/5"
          >
            <Link href={`/events/${signup.eventId}`} className="flex-1">
              <p className="font-medium text-brand-900">{signup.title}</p>
              <p className="text-sm text-zinc-500">{signup.when}</p>
            </Link>
            <button
              type="button"
              disabled={isPending}
              onClick={() => decline(signup.id)}
              className="rounded-lg border border-brand-600/30 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-brand-600/5 disabled:pointer-events-none disabled:opacity-50"
            >
              Ik kan niet
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
