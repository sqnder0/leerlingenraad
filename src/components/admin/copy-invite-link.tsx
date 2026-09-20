"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * `compact`: a small chip for a table row (list page). Otherwise: a full
 * card showing the URL plus a labeled button (invite-created success page).
 * `origin` is filled in client-side only — window isn't available during
 * SSR, so the server-rendered markup shows a relative path until mount.
 */
export function CopyInviteLink({ code, compact = false }: { code: string; compact?: boolean }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Deferred via a microtask so setOrigin isn't called synchronously
    // within the effect body itself (react-hooks/set-state-in-effect).
    Promise.resolve().then(() => setOrigin(window.location.origin));
  }, []);

  async function copy() {
    const ok = await copyToClipboard(`${window.location.origin}/invite/${code}`);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-md border border-brand-600/20 bg-white px-2 py-1 font-mono text-xs text-brand-900 shadow-sm transition-colors hover:bg-brand-600/5"
      >
        {copied && <CheckIcon className="h-3.5 w-3.5 text-brand-600" />}
        {copied ? "Gekopieerd" : `/invite/${code}`}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-brand-600/15 bg-brand-50/50 p-4">
      <p className="break-all font-mono text-sm">{`${origin}/invite/${code}`}</p>
      <button
        type="button"
        onClick={copy}
        className="flex w-fit items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        {copied && <CheckIcon className="h-4 w-4" />}
        {copied ? "Gekopieerd" : "Link kopiëren"}
      </button>
    </div>
  );
}
