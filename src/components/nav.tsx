"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { HomeIcon, CalendarIcon, ClipboardIcon, UsersIcon } from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

function navItems(isAdmin: boolean): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", shortLabel: "Start", icon: HomeIcon },
    { href: "/events", label: "Agenda", shortLabel: "Agenda", icon: CalendarIcon },
    {
      href: "/my/signups",
      label: "Mijn aanmeldingen",
      shortLabel: "Van mij",
      icon: ClipboardIcon,
    },
    ...(isAdmin
      ? [{ href: "/admin", label: "Beheer", shortLabel: "Beheer", icon: UsersIcon }]
      : []),
  ];
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Top nav, visible from `sm` up — pill-style active state. */
export function DesktopNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="hidden flex-wrap gap-1 text-sm sm:flex">
      {navItems(isAdmin).map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-zinc-600 hover:bg-brand-600/10 hover:text-brand-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Fixed bottom tab bar, mobile-only — mimics a native app's tab nav. */
export function MobileTabBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-brand-600/15 bg-white/95 backdrop-blur-sm print:hidden sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems(isAdmin).map(({ href, shortLabel, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              active ? "text-brand-700" : "text-zinc-500 hover:text-brand-700"
            }`}
          >
            <Icon className="h-5 w-5" />
            {shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}
