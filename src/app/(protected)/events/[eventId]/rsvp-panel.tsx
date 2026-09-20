"use client";

import { useState, useTransition } from "react";
import { rsvp, declineAssignment } from "@/actions/member-actions";
import { useConfirmFlash } from "@/hooks/use-confirm-flash";
import { SpinnerIcon, CheckIcon } from "@/components/icons";

type Response = "GOING" | "NOT_GOING" | null;
type AssignmentMode = "ROTATION" | "EVERYONE" | "SPECIFIC" | null;

export function RsvpPanel({
  eventId,
  signupId,
  assignmentMode,
  initialResponse,
}: {
  eventId: string;
  signupId: string | null;
  assignmentMode: AssignmentMode;
  initialResponse: Response;
}) {
  const [response, setResponse] = useState<Response>(initialResponse);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { pendingKey, setPendingKey, confirmedKey, confirm } = useConfirmFlash();

  function respond(next: "GOING" | "NOT_GOING") {
    setError(null);
    setPendingKey(next);
    startTransition(async () => {
      setResponse(next);
      try {
        await rsvp(eventId, next);
        confirm(next);
      } catch {
        setError("Aanmelden is mislukt, probeer opnieuw.");
      }
    });
  }

  function decline() {
    if (!signupId) return;
    setError(null);
    setPendingKey("decline");
    startTransition(async () => {
      setResponse("NOT_GOING");
      try {
        await declineAssignment(signupId);
        confirm("decline");
      } catch {
        setError("Afmelden is mislukt, probeer opnieuw.");
      }
    });
  }

  // Only fair-rotation duty is a one-way "decline and get backfilled by
  // someone else" — EVERYONE/SPECIFIC auto-invites and ordinary opt-in
  // events all just toggle a normal RSVP, no reassignment involved.
  const isBackfillRotation = assignmentMode === "ROTATION";

  if (isBackfillRotation) {
    if (response === "GOING") {
      return (
        <div className="flex flex-col gap-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={pendingKey === "decline"}
            onClick={decline}
            className="flex w-fit items-center gap-1.5 rounded-lg border border-brand-600/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-600/5 disabled:pointer-events-none disabled:opacity-70"
          >
            {pendingKey === "decline" && <SpinnerIcon className="h-3.5 w-3.5" />}
            {confirmedKey === "decline" && <CheckIcon className="h-3.5 w-3.5" />}
            Ik kan niet
          </button>
        </div>
      );
    }
    if (response === "NOT_GOING") {
      return (
        <p className="text-sm text-zinc-500">Je hebt afgemeld, iemand anders is toegewezen.</p>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pendingKey === "GOING"}
          onClick={() => respond("GOING")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-70 ${
            response === "GOING"
              ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
              : "border border-brand-600/30 hover:bg-brand-600/5"
          }`}
        >
          {pendingKey === "GOING" && <SpinnerIcon className="h-3.5 w-3.5" />}
          {confirmedKey === "GOING" && <CheckIcon className="h-3.5 w-3.5" />}
          Ik kom
        </button>
        <button
          type="button"
          disabled={pendingKey === "NOT_GOING"}
          onClick={() => respond("NOT_GOING")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-70 ${
            response === "NOT_GOING"
              ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
              : "border border-brand-600/30 hover:bg-brand-600/5"
          }`}
        >
          {pendingKey === "NOT_GOING" && <SpinnerIcon className="h-3.5 w-3.5" />}
          {confirmedKey === "NOT_GOING" && <CheckIcon className="h-3.5 w-3.5" />}
          Ik kom niet
        </button>
      </div>
    </div>
  );
}
