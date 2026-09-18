"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded border border-brand-600/25 px-3 py-2 text-sm dark:border-brand-400/25"
    >
      Print
    </button>
  );
}
