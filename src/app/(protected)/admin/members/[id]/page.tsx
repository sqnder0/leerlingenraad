import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBalance, getLedgerEntries } from "@/lib/data/points";
import { AdjustmentForm } from "./adjustment-form";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [member, activeSchoolYear] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.schoolYear.findFirst({ where: { isActive: true } }),
  ]);
  if (!member || !activeSchoolYear) notFound();

  const [balance, ledger] = await Promise.all([
    getBalance(member.id, activeSchoolYear.id),
    getLedgerEntries(member.id, activeSchoolYear.id),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">
          {member.firstName} {member.lastName}
        </h1>
        <p className="text-sm text-zinc-500">
          @{member.username} · {member.role}
          {member.isTeacher && " · leerkracht"} · {member.status}
          {member.classGroup && ` · ${member.classGroup}`}
        </p>
      </div>

      <div>
        <p className="text-sm text-zinc-500">Balans dit schooljaar ({activeSchoolYear.label})</p>
        <p className="text-2xl font-semibold text-brand-900 dark:text-brand-50">{balance}</p>
      </div>

      <AdjustmentForm userId={member.id} />

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-500">Geschiedenis</p>
        {ledger.length === 0 ? (
          <p className="text-sm text-zinc-500">Nog geen puntenhistoriek.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-600/15 text-zinc-500 dark:border-brand-400/15">
                  <th className="py-2 pr-4">Datum</th>
                  <th className="py-2 pr-4">Reden</th>
                  <th className="py-2 pr-4">Door</th>
                  <th className="py-2 pr-4">Punten</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-brand-600/10 transition-colors hover:bg-brand-600/5 dark:border-brand-400/10 dark:hover:bg-brand-400/5"
                  >
                    <td className="py-2 pr-4">
                      {new Intl.DateTimeFormat("nl-BE").format(entry.createdAt)}
                    </td>
                    <td className="py-2 pr-4">{entry.reason}</td>
                    <td className="py-2 pr-4">
                      {entry.createdBy.firstName} {entry.createdBy.lastName}
                    </td>
                    <td className="py-2 pr-4">
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
