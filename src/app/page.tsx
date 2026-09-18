export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-brand-50 dark:bg-brand-950">
      <main className="flex max-w-md flex-col gap-3 text-center">
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
