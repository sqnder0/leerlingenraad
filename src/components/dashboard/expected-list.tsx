"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { rsvp, declineAssignment } from "@/actions/member-actions";
import { useConfirmFlash } from "@/hooks/use-confirm-flash";
import { SpinnerIcon } from "@/components/icons";

export type ExpectedSignup = {
  id: string;
  eventId: string;
  title: string;
  when: string;
  /// ROTATION declines trigger a fairness backfill; EVERYONE/SPECIFIC just
  /// flip the RSVP, same as an ordinary opt-in event.
  assignmentMode: "ROTATION" | "EVERYONE" | "SPECIFIC";
};

export function ExpectedList({ signups }: { signups: ExpectedSignup[] }) {
  const [items, removeItem] = useOptimistic(signups, (state, id: string) =>
    state.filter((s) => s.id !== id),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { pendingKey, setPendingKey } = useConfirmFlash();

  function decline(signup: ExpectedSignup) {
    setError(null);
    setPendingKey(signup.id);
    startTransition(async () => {
      try {
        if (signup.assignmentMode === "ROTATION") {
          await declineAssignment(signup.id);
        } else {
          await rsvp(signup.eventId, "NOT_GOING");
        }
        removeItem(signup.id);
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
              disabled={pendingKey === signup.id}
              onClick={() => decline(signup)}
              className="flex items-center gap-1.5 rounded-lg border border-brand-600/30 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-brand-600/5 disabled:pointer-events-none disabled:opacity-70"
            >
              {pendingKey === signup.id && <SpinnerIcon className="h-3.5 w-3.5" />}
              Ik kan niet
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
