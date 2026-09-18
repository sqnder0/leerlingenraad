import type { ReactNode } from "react";
import Link from "next/link";
import { requireApprovedUser } from "@/lib/current-user";
import { logout } from "@/actions/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireApprovedUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col gap-2 border-b border-black/10 px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/events">Agenda</Link>
          <Link href="/my/signups">Mijn aanmeldingen</Link>
          {user.role === "ADMIN" && <Link href="/admin">Beheer</Link>}
        </nav>
        <form action={logout} className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.firstName} <span className="hidden sm:inline">{user.lastName}</span>
          </span>
          <button type="submit" className="text-sm underline underline-offset-2">
            Uitloggen
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
