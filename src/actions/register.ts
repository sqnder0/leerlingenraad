"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUsername } from "@/lib/username";
import { hashPassword } from "@/lib/password";
import { inviteLinkInvalidReason } from "@/lib/invite-links";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Voornaam is verplicht."),
    lastName: z.string().trim().min(1, "Achternaam is verplicht."),
    classGroup: z.string().trim().optional(),
    password: z.string().min(8, "Wachtwoord moet minstens 8 tekens lang zijn."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Wachtwoorden komen niet overeen.",
    path: ["confirmPassword"],
  });

export type RegisterState = { status: "idle" } | { status: "error"; message: string };

/**
 * Public self-registration, gated by an invite link's code rather than
 * admin approval-to-create (the account still lands on PENDING and needs
 * an admin's approval afterwards, same as the admin-created path — see
 * docs/plan.md §1). Consuming the invite and creating the user happen in
 * one transaction so a maxUses cap can't be raced past.
 */
export async function registerViaInvite(
  code: string,
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const invite = await prisma.inviteLink.findUnique({ where: { code } });
  const invalidReason = inviteLinkInvalidReason(invite);
  if (invalidReason) {
    return { status: "error", message: invalidReason };
  }

  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    classGroup: formData.get("classGroup") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const { firstName, lastName, classGroup, password } = parsed.data;

  const username = await generateUsername(firstName, lastName);
  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.create({
      data: { firstName, lastName, username, classGroup, passwordHash, invitedViaId: invite!.id },
    }),
    prisma.inviteLink.update({
      where: { id: invite!.id },
      data: { usedCount: { increment: 1 } },
    }),
  ]);

  try {
    await signIn("credentials", { username, password, redirectTo: "/pending" });
  } catch (error) {
    // `signIn`'s own redirect-on-success throws a special Next.js signal
    // that must NOT be swallowed here, so only handle actual auth errors.
    if (error instanceof AuthError) {
      return {
        status: "error",
        message: "Account aangemaakt, maar automatisch inloggen is mislukt. Log handmatig in.",
      };
    }
    throw error;
  }

  return { status: "idle" };
}
