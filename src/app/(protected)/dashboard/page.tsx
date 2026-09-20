import type { ReactNode } from "react";
import Link from "next/link";
import { requireApprovedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getFairnessSummary } from "@/lib/data/points";
import { NotificationOptIn } from "@/components/notification-opt-in";
import { ExpectedList, type ExpectedSignup } from "@/components/dashboard/expected-list";
import { OptInList, type OptInEvent } from "@/components/dashboard/opt-in-list";
import { ClipboardIcon, CalendarIcon, ClockIcon, CheckCircleIcon } from "@/components/icons";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

const TODAY_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("nl-BE", DATE_FORMAT).format(date);
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-600/15 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
        {icon}
      </div>
      <div>
        <p className="text-2xl leading-tight font-semibold text-brand-900">{value}</p>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  count,
  children,
  footer,
}: {
  icon: ReactNode;
  title: string;
  count: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-brand-600/15 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
          {icon}
        </span>
        <h2 className="font-semibold text-brand-900">{title}</h2>
        {count > 0 && (
          <span className="ml-auto rounded-full bg-brand-600/10 px-2.5 py-0.5 text-xs font-medium text-brand-800">
            {count}
          </span>
        )}
      </div>
      {children}
      {footer}
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireApprovedUser();
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activeSchoolYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  const fairness =
    activeSchoolYear && !user.isTeacher
      ? await getFairnessSummary(user.id, activeSchoolYear.id)
      : null;

  const [expectedRows, optInEventRows] = await Promise.all([
    // Opt-out: duty/rotation slots you're auto-assigned to and still on the
    // hook for — "Ik kan niet" declines and triggers reassignment.
    prisma.signup.findMany({
      where: {
        userId: user.id,
        autoAssigned: true,
        response: "GOING",
        event: { startAt: { gte: now }, status: "PUBLISHED" },
      },
      include: { event: { include: { series: { select: { assignmentMode: true } } } } },
      orderBy: { event: { startAt: "asc" } },
      take: 10,
    }),
    // Opt-in: ordinary events, with your current RSVP (if any) alongside.
    prisma.event.findMany({
      where: { seriesId: null, status: "PUBLISHED", startAt: { gte: now } },
      include: { signups: { where: { userId: user.id }, select: { response: true } } },
      orderBy: { startAt: "asc" },
      take: 10,
    }),
  ]);

  const expected: ExpectedSignup[] = expectedRows.map((s) => ({
    id: s.id,
    eventId: s.eventId,
    title: s.event.title,
    when: formatWhen(s.event.startAt),
    assignmentMode: s.event.series?.assignmentMode ?? "ROTATION",
  }));
  const optInEvents: OptInEvent[] = optInEventRows.map((e) => ({
    id: e.id,
    title: e.title,
    when: formatWhen(e.startAt),
    response: e.signups[0]?.response ?? null,
  }));

  const dueThisWeek = expectedRows.filter((s) => s.event.startAt <= weekFromNow).length;
  const awaitingResponse = optInEvents.filter((e) => e.response === null).length;
  const confirmed = optInEvents.filter((e) => e.response === "GOING").length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">Welkom, {user.firstName}</h1>
        <p className="text-sm text-zinc-500 capitalize">
          {new Intl.DateTimeFormat("nl-BE", TODAY_FORMAT).format(now)}
        </p>
      </div>

      {fairness && (
        <div className="rounded-xl border border-brand-600/15 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>Jouw punten dit schooljaar</span>
            <span>Gemiddelde: {fairness.average.toFixed(1)}</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-brand-900">{fairness.myBalance}</p>
          {fairness.myBalance < fairness.average && (
            <p className="mt-1 text-sm text-zinc-600">
              Je zit {(fairness.average - fairness.myBalance).toFixed(1)} punten onder het
              gemiddelde — meld je gerust aan voor wat extra beurten.
            </p>
          )}
        </div>
      )}

      <NotificationOptIn />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<ClockIcon className="h-5 w-5" />}
          label="Beurten deze week"
          value={dueThisWeek}
        />
        <StatCard
          icon={<CalendarIcon className="h-5 w-5" />}
          label="Nog te bevestigen"
          value={awaitingResponse}
        />
        <StatCard
          icon={<CheckCircleIcon className="h-5 w-5" />}
          label="Aangemeld"
          value={confirmed}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SectionCard
          icon={<ClipboardIcon className="h-5 w-5" />}
          title="Verwacht van jou"
          count={expected.length}
        >
          <ExpectedList signups={expected} />
        </SectionCard>

        <SectionCard
          icon={<CalendarIcon className="h-5 w-5" />}
          title="Opt-in events"
          count={optInEvents.length}
          footer={
            <Link
              href="/events"
              className="text-sm text-brand-700 underline underline-offset-2 transition-colors hover:text-brand-800"
            >
              Volledige agenda
            </Link>
          }
        >
          <OptInList events={optInEvents} />
        </SectionCard>
      </div>
    </div>
  );
}
