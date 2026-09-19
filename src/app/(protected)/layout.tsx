import type { ReactNode } from "react";
import Link from "next/link";
import { requireApprovedUser } from "@/lib/current-user";
import { logout } from "@/actions/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireApprovedUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-brand-600/15 bg-brand-50/90 px-4 py-3 shadow-sm backdrop-blur-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-brand-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline brand mark, not worth next/image's overhead */}
            <img src="/icon.svg" alt="" width={22} height={22} />
            Leerlingenraad
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/dashboard" className="transition-colors hover:text-brand-700">
              Dashboard
            </Link>
            <Link href="/events" className="transition-colors hover:text-brand-700">
              Agenda
            </Link>
            <Link href="/my/signups" className="transition-colors hover:text-brand-700">
              Mijn aanmeldingen
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="transition-colors hover:text-brand-700">
                Beheer
              </Link>
            )}
          </nav>
        </div>
        <form action={logout} className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">
            {user.firstName} <span className="hidden sm:inline">{user.lastName}</span>
          </span>
          <button
            type="submit"
            className="text-sm text-brand-700 underline underline-offset-2 transition-colors hover:text-brand-800"
          >
            Uitloggen
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
