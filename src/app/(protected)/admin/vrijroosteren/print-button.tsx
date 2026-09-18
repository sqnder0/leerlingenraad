"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-brand-600/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-600/5 dark:border-brand-400/30 dark:hover:bg-brand-400/5"
    >
      Print
    </button>
  );
}
