import Link from "next/link";

export default function RejectedPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex max-w-md flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Account niet goedgekeurd
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Je account is niet goedgekeurd. Neem contact op met een beheerder van de leerlingenraad
          als je denkt dat dit een vergissing is.
        </p>
        <Link href="/login" className="text-sm underline underline-offset-2">
          Terug naar inloggen
        </Link>
      </main>
    </div>
  );
}
