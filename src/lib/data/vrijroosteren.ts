import { prisma } from "@/lib/prisma";

export type VrijroosterenRow = {
  date: Date;
  eventTitle: string;
  firstName: string;
  lastName: string;
  classGroup: string | null;
};

/**
 * Who needs to be excused from class, and when, per docs/plan.md: derived
 * read-only from existing GOING signups — no separate approval workflow.
 */
export async function getVrijroosterenRows(
  startDate: Date,
  endDate: Date,
): Promise<VrijroosterenRow[]> {
  const signups = await prisma.signup.findMany({
    where: { response: "GOING", event: { startAt: { gte: startDate, lte: endDate } } },
    include: {
      event: { select: { title: true, startAt: true } },
      user: { select: { firstName: true, lastName: true, classGroup: true } },
    },
    orderBy: [{ event: { startAt: "asc" } }, { user: { lastName: "asc" } }],
  });

  return signups.map((s) => ({
    date: s.event.startAt,
    eventTitle: s.event.title,
    firstName: s.user.firstName,
    lastName: s.user.lastName,
    classGroup: s.user.classGroup,
  }));
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: VrijroosterenRow[]): string {
  const header = ["Datum", "Event", "Naam", "Klas"].join(",");
  const lines = rows.map((r) =>
    [
      new Intl.DateTimeFormat("nl-BE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(r.date),
      csvEscape(r.eventTitle),
      csvEscape(`${r.firstName} ${r.lastName}`),
      csvEscape(r.classGroup ?? ""),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}
