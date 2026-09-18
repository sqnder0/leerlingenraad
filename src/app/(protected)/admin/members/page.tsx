import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { approveMember, rejectMember } from "@/actions/admin/members";

export default async function AdminMembersPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { lastName: "asc" }],
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-900 dark:text-brand-50">Leden</h1>
        <Link
          href="/admin/members/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          Nieuw lid
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-600/15 text-zinc-500 dark:border-brand-400/15">
              <th className="py-2 pr-4">Naam</th>
              <th className="py-2 pr-4">Gebruikersnaam</th>
              <th className="py-2 pr-4">Klas</th>
              <th className="py-2 pr-4">Rol</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-brand-600/10 transition-colors hover:bg-brand-600/5 dark:border-brand-400/10 dark:hover:bg-brand-400/5"
              >
                <td className="py-2 pr-4">
                  <Link href={`/admin/members/${user.id}`} className="underline underline-offset-2">
                    {user.firstName} {user.lastName}
                  </Link>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{user.username}</td>
                <td className="py-2 pr-4">{user.classGroup ?? "—"}</td>
                <td className="py-2 pr-4">{user.role}</td>
                <td className="py-2 pr-4">{user.status}</td>
                <td className="py-2 pr-4">
                  {user.status !== "APPROVED" && (
                    <form action={approveMember.bind(null, user.id)} className="inline">
                      <button type="submit" className="mr-3 underline underline-offset-2">
                        Goedkeuren
                      </button>
                    </form>
                  )}
                  {user.status !== "REJECTED" && (
                    <form action={rejectMember.bind(null, user.id)} className="inline">
                      <button
                        type="submit"
                        className="text-red-600 underline underline-offset-2 dark:text-red-400"
                      >
                        Afwijzen
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
