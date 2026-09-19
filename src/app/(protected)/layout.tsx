import type { ReactNode } from "react";
import Link from "next/link";
import { requireApprovedUser } from "@/lib/current-user";
import { logout } from "@/actions/auth";
import { DesktopNav, MobileTabBar } from "@/components/nav";
import { LogOutIcon } from "@/components/icons";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireApprovedUser();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-brand-600/15 bg-brand-50/90 px-4 py-3 shadow-sm backdrop-blur-sm print:hidden">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline brand mark, not worth next/image's overhead */}
            <img src="/icon.svg" alt="" width={22} height={22} />
            <span className="hidden sm:inline">Leerlingenraad</span>
          </Link>
          <DesktopNav isAdmin={isAdmin} />
        </div>
        <form action={logout} className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-600 sm:inline">
            {user.firstName} {user.lastName}
          </span>
          <button
            type="submit"
            title="Uitloggen"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-600/10 hover:text-brand-800"
          >
            <LogOutIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Uitloggen</span>
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col pb-20 sm:pb-0">{children}</main>
      <MobileTabBar isAdmin={isAdmin} />
    </div>
  );
}
