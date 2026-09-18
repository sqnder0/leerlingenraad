import type { ReactNode } from "react";
import Link from "next/link";
import { requireApprovedUser } from "@/lib/current-user";
import { logout } from "@/actions/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireApprovedUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col gap-2 border-b border-brand-600/15 bg-brand-50 px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between dark:border-brand-400/15 dark:bg-brand-950">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <Link href="/dashboard" className="text-sm font-semibold text-brand-800 dark:text-brand-100">
            Leerlingenraad
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/dashboard" className="hover:text-brand-700 dark:hover:text-brand-300">
              Dashboard
            </Link>
            <Link href="/events" className="hover:text-brand-700 dark:hover:text-brand-300">
              Agenda
            </Link>
            <Link href="/my/signups" className="hover:text-brand-700 dark:hover:text-brand-300">
              Mijn aanmeldingen
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="hover:text-brand-700 dark:hover:text-brand-300">
                Beheer
              </Link>
            )}
          </nav>
        </div>
        <form action={logout} className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.firstName} <span className="hidden sm:inline">{user.lastName}</span>
          </span>
          <button
            type="submit"
            className="text-sm text-brand-700 underline underline-offset-2 dark:text-brand-300"
          >
            Uitloggen
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
