import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revokeInvite } from "@/actions/admin/invites";
import { inviteLinkStatus } from "@/lib/invite-links";
import { CopyInviteLink } from "@/components/admin/copy-invite-link";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Actief",
  EXPIRED: "Verlopen",
  REVOKED: "Ingetrokken",
  EXHAUSTED: "Volzet",
};

export default async function AdminInvitesPage() {
  const invites = await prisma.inviteLink.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-900">Uitnodigingen</h1>
        <Link
          href="/admin/invites/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow"
        >
          Nieuwe link
        </Link>
      </div>

      {invites.length === 0 ? (
        <p className="text-sm text-zinc-500">Nog geen uitnodigingslinks aangemaakt.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-600/15 text-zinc-500">
                <th className="py-2 pr-4">Label</th>
                <th className="py-2 pr-4">Link</th>
                <th className="py-2 pr-4">Gebruikt</th>
                <th className="py-2 pr-4">Verloopt</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const status = inviteLinkStatus(invite);
                return (
                  <tr
                    key={invite.id}
                    className="border-b border-brand-600/10 transition-colors hover:bg-brand-600/5"
                  >
                    <td className="py-2 pr-4">{invite.label ?? "—"}</td>
                    <td className="py-2 pr-4">
                      <CopyInviteLink code={invite.code} compact />
                    </td>
                    <td className="py-2 pr-4">
                      {invite.usedCount}
                      {invite.maxUses !== null ? ` / ${invite.maxUses}` : ""}
                    </td>
                    <td className="py-2 pr-4">
                      {invite.expiresAt
                        ? new Intl.DateTimeFormat("nl-BE").format(invite.expiresAt)
                        : "Nooit"}
                    </td>
                    <td className="py-2 pr-4">{STATUS_LABEL[status]}</td>
                    <td className="py-2 pr-4">
                      {status === "ACTIVE" && (
                        <form action={revokeInvite.bind(null, invite.id)} className="inline">
                          <button
                            type="submit"
                            className="text-red-600 underline underline-offset-2"
                          >
                            Intrekken
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
