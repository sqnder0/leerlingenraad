"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
    >
      Print
    </button>
  );
}
