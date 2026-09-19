import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6">
      <main className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-brand-600/15 bg-white p-8 text-center shadow-xl shadow-brand-900/5">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline brand mark, not worth next/image's overhead */}
        <img src="/icon.svg" alt="" width={40} height={40} />
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">
          Account in afwachting
        </h1>
        <p className="text-zinc-600">
          Je account is aangemaakt maar nog niet goedgekeurd door een beheerder van de
          leerlingenraad. Kom later terug of neem contact op als dit lang duurt.
        </p>
        <Link href="/login" className="text-sm text-brand-700 underline underline-offset-2">
          Terug naar inloggen
        </Link>
      </main>
    </div>
  );
}
