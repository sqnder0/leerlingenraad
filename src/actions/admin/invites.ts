"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const createInviteSchema = z.object({
  label: z.string().trim().optional(),
  expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
});

export type CreateInviteState =
  { status: "idle" } | { status: "error"; message: string } | { status: "success"; code: string };

export async function createInvite(
  _prevState: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const admin = await requireAdmin();

  const parsed = createInviteSchema.safeParse({
    label: formData.get("label") || undefined,
    expiresInDays: formData.get("expiresInDays") || undefined,
    maxUses: formData.get("maxUses") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const { label, expiresInDays, maxUses } = parsed.data;

  const invite = await prisma.inviteLink.create({
    data: {
      code: randomBytes(9).toString("base64url"),
      label,
      createdById: admin.id,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
      maxUses: maxUses ?? null,
    },
  });

  revalidatePath("/admin/invites");
  return { status: "success", code: invite.code };
}

export async function revokeInvite(inviteId: string) {
  await requireAdmin();
  await prisma.inviteLink.update({ where: { id: inviteId }, data: { revokedAt: new Date() } });
  revalidatePath("/admin/invites");
}
