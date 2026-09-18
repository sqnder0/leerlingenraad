import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-brand-50 dark:bg-brand-950">
      <main className="flex max-w-md flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900 dark:text-brand-50">
          Account in afwachting
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Je account is aangemaakt maar nog niet goedgekeurd door een beheerder van de
          leerlingenraad. Kom later terug of neem contact op als dit lang duurt.
        </p>
        <Link href="/login" className="text-sm underline underline-offset-2">
          Terug naar inloggen
        </Link>
      </main>
    </div>
  );
}
