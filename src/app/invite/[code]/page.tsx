import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { inviteLinkInvalidReason } from "@/lib/invite-links";
import { RegisterForm } from "./register-form";

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invite = await prisma.inviteLink.findUnique({ where: { code } });
  const invalidReason = inviteLinkInvalidReason(invite);

  if (invalidReason) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6">
        <main className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-brand-600/15 bg-white p-8 text-center shadow-xl shadow-brand-900/5">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline brand mark, not worth next/image's overhead */}
          <img src="/icon.svg" alt="" width={40} height={40} />
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">
            Ongeldige uitnodiging
          </h1>
          <p className="text-zinc-600">{invalidReason}</p>
          <Link href="/login" className="text-sm text-brand-700 underline underline-offset-2">
            Terug naar inloggen
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6">
      <RegisterForm code={code} />
    </div>
  );
}
