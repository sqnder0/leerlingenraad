export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex max-w-md flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Leerlingenraad
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Planningstool voor de leerlingenraad. Nog in opbouw, zie{" "}
          <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
            docs/plan.md
          </code>{" "}
          voor het volledige plan en de build-order.
        </p>
      </main>
    </div>
  );
}
