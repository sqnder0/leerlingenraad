export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6 dark:from-brand-950 dark:via-brand-900 dark:to-brand-950">
      <main className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-brand-600/15 bg-white p-8 text-center shadow-xl shadow-brand-900/5 dark:border-brand-400/15 dark:bg-brand-950/60">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline brand mark, not worth next/image's overhead */}
        <img src="/icon.svg" alt="" width={48} height={48} />
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900 dark:text-brand-50">
          Leerlingenraad
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Planningstool voor de leerlingenraad. Nog in opbouw, zie{" "}
          <code className="rounded bg-brand-600/10 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-brand-400/15">
            docs/plan.md
          </code>{" "}
          voor het volledige plan en de build-order.
        </p>
      </main>
    </div>
  );
}
