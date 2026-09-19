"use client";

import { useState, useTransition } from "react";
import { rsvp, declineAssignment } from "@/actions/member-actions";

type Response = "GOING" | "NOT_GOING" | null;

export function RsvpPanel({
  eventId,
  signupId,
  isRotationEvent,
  autoAssigned,
  initialResponse,
}: {
  eventId: string;
  signupId: string | null;
  isRotationEvent: boolean;
  autoAssigned: boolean;
  initialResponse: Response;
}) {
  const [response, setResponse] = useState<Response>(initialResponse);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function respond(next: "GOING" | "NOT_GOING") {
    setError(null);
    startTransition(async () => {
      setResponse(next);
      try {
        await rsvp(eventId, next);
      } catch {
        setError("Aanmelden is mislukt, probeer opnieuw.");
      }
    });
  }

  function decline() {
    if (!signupId) return;
    setError(null);
    startTransition(async () => {
      setResponse("NOT_GOING");
      try {
        await declineAssignment(signupId);
      } catch {
        setError("Afmelden is mislukt, probeer opnieuw.");
      }
    });
  }

  if (isRotationEvent) {
    if (autoAssigned && response === "GOING") {
      return (
        <div className="flex flex-col gap-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={isPending}
            onClick={decline}
            className="w-fit rounded-lg border border-brand-600/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-600/5 disabled:pointer-events-none disabled:opacity-50"
          >
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
          disabled={isPending}
          onClick={() => respond("GOING")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
            response === "GOING"
              ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
              : "border border-brand-600/30 hover:bg-brand-600/5"
          }`}
        >
          Ik kom
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => respond("NOT_GOING")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
            response === "NOT_GOING"
              ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
              : "border border-brand-600/30 hover:bg-brand-600/5"
          }`}
        >
          Ik kom niet
        </button>
      </div>
    </div>
  );
}
